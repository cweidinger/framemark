'use strict';

angular.module('nglogApp')
    .service('lgOrm', ['$location', '$q', 'Orestm', '$http', 'util', function lgOrm($location, $q, Orestm, $http, util) {

// prototypal subtyping
var Orm = function() { Orestm.call(this); };
Orm.prototype = new Orestm();
Orm.prototype.constructor = Orm;

// Necessary configuration of Orestm
Orm.prototype.idField = '_id';
Orm.prototype.backendHasBulkExecutor = false;

      Orm.prototype.pageDescription = function(page) {
        return (page.name || util.capitalize(page.link)) + (page.tagline ? ' : ' + page.tagline : '');
      };
/*
    directives
        graphtags - tags
    services
            neo4j - backend but in frontend for debugging purposes
            grapi - clientside abstraction in front of neo4j
 */
Orm.prototype.pages = [
  {
    heading: 'GTD',
    pages: [
      { link: 'collect', hotkeys: 'g c', tagline: 'Coral all your stuff'},
      { link : 'process', hotkeys: 'g p', tagline: 'Crank down your in-basket'},
      { link : 'organize', hotkeys: 'g o', tagline: 'Keep your Todos doable'},
      { link : 'do', hotkeys: 'g d', tagline: 'Get it done'},
      { link : 'review', hotkeys: 'g r', tagline: "See it all"},
    ]
  },
  {
    heading: 'Power User',
    pages : [
      { link : '', name: 'Home', hotkeys: 'g h'},
      { link : 'graph', hotkeys: 'g g'},
      //{ link : 'navbar'}, // implementation detail
    ]
  },
  {
    heading: 'Legacy Logger',
    pages: [
      { link : 'account-group'},
      { link : 'account-mgt'},
      { link : 'table'},


      { link : 'log', name: "Log Time"},
      { link : 'mobile', name: 'Mobile html5 app for logging time on a phone'},
      { link : 'stats', name: 'for analyzing time spent'},

      { link : 'import', name: 'Import finances'},
      { link : 'group-accounts', name: 'Import finances, group by transaction by account'},

      // not really used so not really working
      { link : 'keyval'},
      { link : 'projects'},
      { link : 'organize-notes', name: 'organize nodes', tagline: 'Easily move notes from one place to another'},
      { link : 'calendar'},
    ],
  },
  {
    heading: 'Other projects',
    pages : [
      { link : 'framemark'},
      { link : 'github'},
      { link : 'dev'}, // try react
    ]
  },
  {
    heading: 'Not working',
    pages : [
      // nothing
      { link : 'accts'},
      { link : 'search'},

      // for my profile, did this ever work
      { link : 'demo'},

      // ancient
      { link : 'dashboard'}, // still looking for /context endpoint
    ]
  },
  //{
  //  heading: 'Other projects',
  //  pages : []
  //},
  //{
  //  heading: 'Other projects',
  //  pages : []
  //},
];

// copy of hmlog m.tables  -- should be part of shared config object
Orm.prototype.tablesList = ['user', 'item', 'accountitem','account', 'accountgroup', 'transactiongroup', 'transaction'];
Orm.prototype.schemas = {

    user : {
        primaryKey : '_id',
        recordOrder : [
            {attribute : 'username', descending : false}
        ],
        fieldOrder : ['_id', 'username', 'email', 'firstName', 'lastName', 'foundOutThru', 'type', 'info'], // hashedPassword and salt not sent over
        fields : {
            _id : {header : 'ID', type : 'string' },
            username : {header : 'User Name', type : 'string' },
            email : {header : 'Email', type : 'string' },
            firstName : {header : 'First Name', type : 'string' },
            lastName : {header : 'Last Name', type : 'string' },
            foundOutThru : {header : 'Found Out Thru', multiple : "csv", type : 'inList', inList : ['Original', 'Live On Road', 'Driving On Road', 'Member Talking', 'Customer Talking', 'Website', 'Being Family', 'Family Talking'] },
            type : {header : 'Type', type : 'inList', multiple : "csv", inList : ['Member', 'Vender', 'Neighbor', 'Extended Family', 'Customer'] },
            info : {header : 'Info', type : 'string' },
            password : {header : 'password', type : 'string' }
        }
    },


    item : {
        primaryKey : '_id',
        recordOrder : [
            {attribute : 'name', descending : false}
        ],
        fieldOrder : ['name', 'defaultaccount', 'calculatedPrice', 'depreciateOver', 'otherNames'],
        fields : {
            name : {header : 'Name', type : 'string' },
            otherNames : {header : 'Other Names', type : 'string' },
            calculatedPrice : {header : 'Calculated Price', type : 'string' },
            depreciateOver : {header : 'Depreciate Over Years', type : 'string' },
            defaultaccount : {header : 'Default account', type : 'inTable', table : 'account', tableField : 'name', nullable : true }
        }
    },


    accountitem : {
        primaryKey : '_id',
        recordOrder : [
            {attribute : 'account', descending : false},
            {attribute : 'item', descending : false}
        ],
        fieldOrder : ['account', 'item', 'amount'],
        fields : {
            amount : {header : 'Amount', type : 'number' },
            account : {header : 'account', type : 'inTable', table : 'account', tableField : 'name' },
            item : {header : 'Item', type : 'inTable', table : 'item', tableField : 'name' }
        }
    },


    account : {
        primaryKey : '_id',
        recordOrder : [
            {attribute : 'name', descending : false}
        ],
        fieldOrder : ['_id', 'name', 'parent', 'children', 'owner'],
        fields : {
            _id : {header : 'ID', type : 'string' },
            name : {header : 'Name', type : 'string' },
            parent : {header : 'Parent', type : 'inTable', table : 'account', tableField : 'name', nullable : true },
            children : {header : 'Children', type : 'inTable', multiple : "csv", table : 'account', tableField : 'name', nullable : true },
            note : {header : 'Note', type : 'string' },
            onDate : {header : 'On Date', type : 'datetime' },
            // type : {header : 'status', type : 'inList', inList :['Routine', 'Account', 'Project', 'ASAP', 'Soon', 'Later', 'Maybe', 'Waiting For', 'Time Specific Action', 'Date Specific Action', 'Day Specific Info', 'Note', 'Completed Action', 'Completed Project'] },
            tags : {header : 'Tags', type : 'inTable', multiple : "csv", table : 'account', tableField : 'name', nullable : true },
            owner : {header : 'Logger', type : 'inTable', table : 'user', tableField : 'username'}
        },
        // orDefaultType : function(inputType) {
        //     return (typeof Orm.prototype.schemas.account.type[inputType] === 'undefined') ?
        //          'Account' : inputType;
        // },
        // type : {
        //     'Account' : { dateAdj : 'Cleanup'},
        //     'Project' : { dateAdj : 'Due'},
        //     'ASAP' : { dateAdj : 'Due'},
        //     'Soon' : { dateAdj : 'Due'},
        //     'Later' : { dateAdj : 'Due'},
        //     'Routine' : { dateAdj : 'Next'},
        //     'Waiting For' : { dateAdj : 'Checkup'},
        //     'Maybe' : { dateAdj : 'Reevaluation'},
        //     'Time Specific Action' : { dateAdj : ''}, // TSA
        //     'Date Specific Action' : { dateAdj : ''},  // DSA
        //     'Day Specific Info' : { dateAdj : ''}, // DSI
        //     'Note' : { dateAdj : 'Cleanup'},
        //     'Completed Action' : { dateAdj : 'Completion'},
        //     'Completed Project' : { dateAdj : 'Completion'}
        // }
    },

    accountgroup : {
        primaryKey : '_id',
        recordOrder : [
            {attribute : 'name', descending : false}
        ],
        fieldOrder : ['name', 'description', 'accounts'],
        fields : {
            name : {header : 'Name', type : 'string' },
            description : {header : 'Description', type : 'string' },
            accounts : {header : 'Accounts', type : 'inTable', multiple : "csv", table : 'account', tableField : 'name', nullable : true },
            searchCriteria : {header : 'Should not display', type : 'string' }
        }
    },



     transactiongroup : {
        primaryKey : '_id',
        recordOrder : [
            {attribute : 'name', descending : false}
        ],
        fieldOrder : ['name', 'description', 'calculatedHourlyRate'/*, 'transactions'*/],
        fields : {
            name : {header : 'Name', type : 'string' },
            description : {header : 'Description', type : 'string' },
            calculatedHourlyRate : {header : 'Calculated Hourly Rate', type : 'string' }
            // transactions : {header : 'Transactions', type : 'inTable', multiple : "csv", table : 'transaction', tableField : 'dsl' }
        }
    },


    transaction : {
        primaryKey : '_id',
        recordOrder : [
            {attribute : 'onDate', descending : true},
            {attribute : 'amount', descending : true}
        ],
        fieldOrder : ['_id','dsl', 'amount', 'item', 'subtractFrom', 'addTo', 'tags', 'transactiongroup', 'onDate'],
        fields : {
            _id : {header : 'ID', type : 'string' },
            onDate : {header : 'On Date', type : 'datetime' },
            // importedFrom : {header : 'Imported From', type : 'string' },
            // createdOn : {header : 'Created On', type : 'datetime' },
            dsl : {header : 'Note', type : 'dsl' },
            transactiongroup : {header : 'Group', type : 'inTable', table : 'transactiongroup', tableField : 'name', nullable : true },
            tags : {header : 'Tags', type : 'inTable', multiple : "csv", table : 'account', tableField : 'name', nullable : true },

            amount : {header : 'Amount', type : 'number' },
            item : {header : 'Item', type : 'inTable', table : 'item', tableField : 'name' },
            subtractFrom : {header : 'Subtract From', type : 'inTable', table : 'account', tableField : 'name' },
            addTo : {header : 'Add To', type : 'inTable', table : 'account', tableField : 'name' },

        }
    }


};

Orm.prototype.genId = function () {
    return util.getObjectId();
};

Orm.prototype.bulkPost = function (txs) {
    var self = this;
    util.time('lgOrm.bulkPost');
    // if (this.txs.length > 10) {
    //     console.log('`g you just did tried to create lots of records, was it the right thing?')
    //     debugger;
    //     throw "Something you just did tried to create lots of records, was it the right thing?";
    // }

    // don't send ones already sent
    var txsU = '';
    var nonSentTxs = [];
    for (var i = 0; i < this.txs.length; i++) {
        if (typeof this.txs[i].status === 'undefined' || this.txs[i].status === 'error') {
            this.txs[i].status = 'sent';
            nonSentTxs.push(this.txs[i]);
            txsU += this.txs[i].unique + ',';
        }
    };
    util.log('debug', 'lgOrm.bulkSuccessHandler', 'sent ' + txsU);

    var request = {
        method: 'POST',
        url : this.backendPath() + 'logger/backend/bulk',
        data : nonSentTxs,//util.str2ab(LZString.compress("raw buffer"))//compressedString//txs
        timeout: 1000 * 60 * 5 // 5 minutes
    };
    $http(request).
        success(this.bulkSuccessHandler.bind(this, nonSentTxs)).
        error(this.bulkErrorHandler.bind(this,nonSentTxs));
};

Orm.prototype.bulkSuccessHandler = function(justSentTxs, data/*, status, headers, config*/) {
    try {
        util.log('debug', 'lgOrm.bulkSuccessHandler', 'recieved ' + Object.keys(data.successes));
    } catch(all) {
        debugger;
        // if you end up here durring development it most likely means that you need the following line at the top of your controller
        //    if (this.isUnknown()) { $scope.$destroy(); return; }
    }
    util.timeEnd('lgOrm.bulkPost', 'request succeeded');
    util.time('lgOrm.bulkPost.successClosure');
    var j;
    for (var unique in data.successes) {
        if (!data.successes[unique]) {
            if (data.resps[unique].type === 'optimisticLockException') {
                alert(data.resps[unique].message);
            } else {
                util.log('fatal','lgOrm.bulkPost', 'Request succeeded but not all transactions were successful');
            }
        }
        j = util.findIndexOfObjectInArrayWithProperty(this.txs, 'unique', unique);
        if (typeof this.txs[j].onsuccess === 'function') { // only for get tables
            this.txs[j].onsuccess(data.resps[unique]);
        }
        this.callWatchAll(this.txs[j].table, this.txs[j]);
        this.txs.splice(j,1);
    }
    this.callTxsChangedCallbacks();
    util.timeEnd('lgOrm.bulkPost.successClosure','processed txs and callbacks');
    // THIS OCCURS WHEN ANOTHER BULK REQUEST IS MADE BEFORE THE LAST ONE SUCCEEDED
    // if (this.txs.length !== 0) {
    //   util.log('fatal', 'lgOrm.bulkPost', 'Request successful but txs still outstanding!');
    // }
};

Orm.prototype.bulkErrorHandler = function(justSentTxs, data, status/*,headers, config*/) {
    console.log('bulk error> status: ' + status)
    console.log(data)
    console.log(justSentTxs)
    debugger;
    for (var i = this.txs.length - 1; i >= 0; i--) {
        for (var i = justSentTxs.length - 1; i >= 0; i--) {
            if (this.txs[i].unique === justSentTxs[i].unique) {
                this.txs[i].status = 'error';
            }
        };
    };
}

Orm.prototype.request = function (o) {
    // table, callback, id, method
    var url;
    if (typeof o === 'undefined' || typeof o.table === 'undefined' || typeof o.method === 'undefined' || typeof o.then !== 'function') { throw 'Orm.prototype.request must be passed an object with method, table, "then" callback'; }
    // VALIDATION put, post have record
    o.method = o.method.toUpperCase();
    // if (o.table === 'transaction') debugger;
    url = this.backendPath() + 'logger/backend/'+o.table;
    if (typeof o[this.idField] !== 'undefined' && o.method !== 'POST') {
        url += '/' + o[this.idField];
    }
    var request = {
        method: o.method,
        url : url,
        data : o
    };
    var promise = $http(request).
        success(function(data/*, status, headers, config*/) {
            o.then(true, data);
        }).
        error(function(data, status/*,headers, config*/) {
            o.then(false, status);
        });
    return promise;
};

Orm.prototype.ensure = function(table, newRecord) {
    var existingRecord = this.get(table, this.getIdsWhere(table, 'name', newRecord.name));
    if (!existingRecord) {
        this.add(table, newRecord);
        existingRecord = newRecord;
    }
    return existingRecord;
};

Orm.prototype.ensureRequiredDataExists = function(table) {
    switch (table) {
    case 'item':
        this.ensure('item',{name : 'minutes'});
        this.ensure('item',{name : 'dollars'});
        break;
    case 'account':
        var accountRoot = this.ensure('account',{name : 'root'});
        if (util.isBlank(accountRoot.children)) {
            var firstChild = this.add('account', {
                name : 'First Node',
                parent: accountRoot[this.idField],
                children: '',
                note: 'Hey, welcome to Logger!\n\n' +
                  'You can create more Nodes by right clicking on "First Node" in the control to the left.\n\n' +
                  'Go to town and let us know how to improve it.\n\n' +
                  'Sincerely,\n\n    The Logger Team.'
            });
            accountRoot.children = firstChild[this.idField];
            this.put('account', accountRoot);
        }
        break;
    }
};



Orm.prototype.currentUserId = function () {
    return this.currentUser[this.idField];
};

Orm.prototype.currentUsername = function () {
    return this.currentUser.username;
};


Orm.prototype.minutesItemId = function() {
    var minutesName = 'minutes';
    return this.getIdsWhere('item','name', minutesName)[0];
};

Orm.prototype.ownerAccountId = function() {
    return this.getIdsWhere('account', 'name', this.currentUsername())[0]
};


Orm.prototype.lastTimeTransaction = function () {
    var minutesId = this.minutesItemId();
    var ownerId = this.currentUserId();
    return this.query({
        table : 'transaction',
        criteria : function (r) {
            return r.item === minutesId && r.owner === ownerId;
        },
        options : {
            sort: [{attribute : 'onDate', descending : true}],
            start: 0,
            count: 1
        }
    });
};

Orm.prototype.updateLastEndTime = function(otherStartdate) {
    var records = this.lastTimeTransaction();
    if (records.length === 1) {
        var record = records[0], stoptime = new Date(otherStartdate);
        if (stoptime.getTime() < new Date(record.onDate).getTime()) {
            if (confirm('This entry is before your last entry. Did you mean this '+util.dateTohhmmss(stoptime)+' tomorrow?')) {
                stoptime = new Date(stoptime.getTime() + 1000 * 60 * 60 * 24);
            } else {
                return false; // don't do anything
            }
        }
        var msDiff = stoptime.getTime() - new Date(record.onDate).getTime();
        record.amount = msDiff / 1000 / 60;
        this.put('transaction', record);
    }
    return stoptime;
};

// --------------------------- old lgIdentity ---------------------------------------------

// controllers that need authenticating need this in their first line
// if (!lgOrm.isAuthenticated()) { $scope.$destroy(); return; }

Orm.prototype.isLocalhost = function() {
    return $location.$$host === '127.0.0.1' || $location.$$host === '192.168.0.85' || $location.$$host === '0.0.0.0';
};
Orm.prototype.backendPath = function() {
    if (this.isLocalhost()) {
        return 'https://www.clayweidinger.com/hmlog/';
        //return 'http://localhost:9000/';
    } else {
        return '../hmlog/';
    }
};
Orm.prototype.quickBootHack = function() {
    // hack for quick boot into whatever location I'm working on
    // TODO: remove this eventually b/c 3rd party JS could just get the password from localStorage...
    $http.defaults.headers.common.username = window.localStorage.getItem('username');
    $http.defaults.headers.common.password = window.localStorage.getItem('password');
    this.authenticateUser($http.defaults.headers.common.username, $http.defaults.headers.common.password);
    var path = $location.path();
    // it is likely that after this fires, some controller somewhere will redirect them back to home so... the following
    setTimeout(function () {  // redirecting back to the page they wanted to go to
        $location.path(path);
    },200);
};
Orm.prototype.isAuthenticated = function() {
    var isAuthed = !!this.currentUser;
    if (!isAuthed) $location.path('');
    return isAuthed;
};
Orm.prototype.resetPassword = function (username, email) {
    var dfd = $q.defer();
    $http.post(this.backendPath() + 'reset-password', {username : username, email : email}).then(function (response){
        if (response.data.success) {
            dfd.resolve(true);
        } else {
            dfd.resolve(false);
        }
    });
    return dfd.promise;
};
Orm.prototype.changePassword = function (username, oldPassword, newPassword) {
    var self = this, dfd = $q.defer();
    $http.post(this.backendPath() + 'change-password', {username : username, oldPassword : oldPassword, newPassword : newPassword}).then(function (response){
        if (response.data.success) {
            self.password = newPassword;
            $http.defaults.headers.common['password'] = newPassword;
            dfd.resolve(true);
        } else {
            dfd.resolve(false);
        }
    });
    return dfd.promise;
};
Orm.prototype.signup = function (username, password, email) {
    var self = this, dfd = $q.defer();
    $http.post(this.backendPath() + 'signup', {username : username, password : password, email: email}).then(function (response){
        if (response.data.success) {
            self.currentUser = response.data.user;
            self.username = username;
            self.password = password;
            $http.defaults.headers.common['username'] = username;
            $http.defaults.headers.common['password'] = password;
            util.publish('lgOrm.currentUser', self.currentUser);
            // if (self.isLocalhost()) {
                window.localStorage.setItem('username', username);
                window.localStorage.setItem('password', password);
            // }
            dfd.resolve(true);
        } else {
            dfd.resolve(false);
        }
    });
    return dfd.promise;
};
Orm.prototype.authenticateUser = function (username, password) {
    var self = this, dfd = $q.defer();
    $http.post(this.backendPath() + 'login', {username : username, password : password}).then(function (response){
        if (response.data.success) {
            self.currentUser = response.data.user;
            self.username = username;
            self.password = password;
            $http.defaults.headers.common['username'] = username;
            $http.defaults.headers.common['password'] = password;
            util.publish('lgOrm.currentUser', self.currentUser);
            // if (self.isLocalhost()) {
                window.localStorage.setItem('username', username);
                window.localStorage.setItem('password', password);
            // }
            dfd.resolve(true);
        } else {
            dfd.resolve(false);
        }
    });
    return dfd.promise;
},
Orm.prototype.signout = function() {
    this.currentUser = null;
    this.username = '';
    this.password = '';
    $http.defaults.headers.common['username'] = this.username;
    $http.defaults.headers.common['password'] = this.password;
    util.publish('lgOrm.currentUser', self.currentUser);
    this.clearData();
    // if (this.isLocalhost()) {
        window.localStorage.setItem('username', '');
        window.localStorage.setItem('password', '');
    // }
    return !!this.currentUser;
};

// --------------------------- old lgIdentity ---------------------------------------------

// ---------------------------------- tree related ----------------------------------------
Orm.prototype.inSubtree = function(table, subtreeId, nodeId) {
    var node = this.get(table, nodeId);
    if (typeof node === 'undefined') return false;
    if (nodeId === subtreeId) return true;
    return this.inSubtree(table, subtreeId, node.parent)
};

Orm.prototype.getParents = function(table, nodeId) {
    var node = this.get(table, nodeId);
    if (!node) return [];
    if (!node.parent) return [];  //[node.name];  // don't add root
    var ar = this.getParents(table, node.parent);
    ar.unshift(node.name);
    return ar;
};

Orm.prototype.verifyIntegrity = function(o) {
    // table, notice, nameField, rootName
    util.time('lgOrm.verifyIntegrity');
    o.notice = o.notice || '';
    var self = this, hash = {}, original = {}, rootId;
    function setRootId(record) {
        if (typeof o.rootName === 'undefined') {
            console.log('SetRootId: The case of having no rootname isn\'t well defined!.');
            if (!record.parent) { rootId = record._id; }
        } else {
            if (record[o.nameField] === o.rootName) {
                rootId = record._id;
            }
        }
    };
    this.query({
        table : o.table,
        criteria : function(record) {
            if (record.owner === self.currentUserId()) {
                setRootId(record);
                hash[record._id] = {
                    id : record._id,
                    parent : (record.parent ? record.parent : '#'),
                    text : record[o.nameField],
                    children : record.children
                };
                original[record._id] = {
                    id : record._id,
                    parent : (record.parent ? record.parent : '#'),
                    text : record[o.nameField],
                    children : record.children
                };
            }
        }, options : {}
    });
    // for 1 root first
    // find root, find all children, mark rows as being handled by removing from list
    this.visitValidate(hash, rootId, o.notice, o.nameField);
    // transform first children of THE root to roots themselves
    var parent;
    for (var id in hash) {
        if (typeof original[hash[id].parent] === 'undefined') {
            util.log('fatal', '278' + o.notice + ':NOPARENT: ' + hash[id].text + ' was not a child of a parent on the root tree');
        } else {
            util.log('fatal', '280' + o.notice + ': ' + hash[id].text + ' was not a child of a parent on the root tree but it does have parent.text="' + original[hash[id].parent].text + '"');
            // fix it
            // parent = this.get(table, hash[id].parent);
    //     if (parent.children.indexOf(id) === -1) {
        //      parent.children = util.concatWithComma(parent.children, id);
    //     } else {
    //       parent.children = util.removeStrFromCsv(parent.children, id);
    //     }
            // this.put(table, parent);
        }
    }
    util.timeEnd('lgOrm.verifyIntegrity', o.table);
};
Orm.prototype.visitValidate = function(hash, id, notice, nameField) {
    if (typeof hash[id] === 'undefined') {
        debugger;
    }
    var ar = hash[id].children.split(',');
    if (ar[0] === '') ar = [];
    for (var i = 0; i < ar.length; i++) {
        if (typeof hash[ar[i]] === 'undefined') {
            var rec = this.get('account', ar[i]);
            if (rec) {
                util.log('fatal', '298' + notice + ': ID ' + ar[i] + '('+rec[nameField]+') is not in table but is a child of "' + hash[id].text + '"');
            } else {
                util.log('fatal', '300' + notice + ': ID ' + ar[i] + ' is not in table but is a child of "' + hash[id].text + '"');
            }
        } else if (hash[ar[i]].parent !== id) {
            // if (typeof hash[ar[i]].parent === 'undefined') {
            //  util.log('fatal', '299' + notice + ': ' + hash[id].text + ' was a child of id ' + ar[i].parent + ' but did not have the latter as the formers parent BECAUSE THE LATTER DOES NOT EXIST.');
            // } else {
                try {
                    debugger;
                    util.log('fatal', '303' + notice + ': ' + hash[id].text + ' was a child of ' + hash[hash[ar[i]].parent].text + ' but did not have the ' + hash[hash[ar[i]].parent].text + ' as the its parent.');
                } catch (all) {
                    debugger;
                }
            // }
        } else {
            if (typeof hash[ar[i]].children === 'undefined') {
                util.log('fatal', '305' + notice + ': ' + hash[id].text + ' has a child with an id of ' + ar[i] + ' that isn\'t in the hash');
            } else {
                this.visitValidate(hash, ar[i], notice, nameField); // recurse
            }
        }
    }
    delete hash[id];
};

Orm.prototype.addNode = function(table, parent, attrs) {
    var node = {
        owner: this.currentUserId(),
        parent: parent,
        children: ''
    };
    for (var key in attrs) {
        node[key] = attrs[key];
    }
    var nodeId = this.add(table, node)[this.idField];
    // add id to children of o.parent
    var parentNode = this.get(table, parent);
    parentNode.children = util.concatWithComma(parentNode.children, nodeId);
    this.put(table, parentNode);
    this.verifyIntegrity({
        table: table,
        notice: 'lgOrm.addNode',
        nameField: 'name',
        rootName: 'root'
    }); // obj.field, scope.rootname
    return nodeId;
};

Orm.prototype.moveNode = function(table, id, oldParentId, newParentId) {
    var rec = this.get(table, id),
        ar, index;
    rec.parent = newParentId;
    this.put(table, rec);
    // remove node as child from old parent
    if (oldParentId) {
        rec = this.get(table, oldParentId);
        rec.children = util.removeStrFromCsv(rec.children, id);
        this.put(table, rec);
    }
    // add node as child to new parent
    if (newParentId) {
        rec = this.get(table, newParentId);
        rec.children = util.concatWithComma(rec.children, id);
        this.put(table, rec);
    }
};

Orm.prototype.removeSubtree = function(table, id, replacementId) {
    var rec = this.get(table, id);
    var ar = rec.children.split(',');
    for (var i = 0; i < ar.length; i++) {
        if (ar[i] !== '') {
            this.removeSubtree(table, ar[i], replacementId);
        }
    }
    this.remove(table, id);
    this.replaceIdInForeignKeys(table, id, replacementId);
};

// ---------------------------------- END OF tree related ----------------------------------------

// ---------------------------------- BEGINNING OF account match ----------------------------------------

Orm.prototype.rankMatches = function(inputAccount, forceRecount) {
    var self = this;
    var ids = {};
    var totals = {};
    function countWordsForAccount(account) {
        account.parents = self.getParents('account', account.parent).join(' / ');
        // maybe also count PARENT AND CHILDREN node names? ~ or just give a score based on their relationship!!!!!
        // what about words that are close but not exact matches?
        // elastic search
        var wordCounts = {};
        getListFromString(account.name).forEach(function(word) {
            inc(wordCounts, word);
            inc(totals, word);
        });
        getListFromString(account.note).forEach(function(word) {
            inc(wordCounts, word);
            inc(totals, word);
        });
        ids[account._id] = wordCounts;
    }
    // count up words
    if (forceRecount || !this.rankMatches.totals) {
        var accounts = util.clone(this.getTableRef('account'))
        accounts = accounts.filter(function(account) { return account._id != inputAccount._id; });
        accounts.forEach(countWordsForAccount);
        this.rankMatches.totals = totals;
        this.rankMatches.ids = ids;
        this.rankMatches.accounts = accounts;
    } else {
        totals = this.rankMatches.totals;
        ids = this.rankMatches.ids;
        accounts = this.rankMatches.accounts;
    }
    // if (!ids[inputAccount._id]) {
    //     inputAccount._id = "__inputAccount";
    // }
    function countWordsForThisAccount(account) {
        // maybe also count PARENT AND CHILDREN node names? ~ or just give a score based on their relationship!!!!!
        // what about words that are close but not exact matches?
        // elastic search
        var wordCounts = {};
        getListFromString(account.name).forEach(function(word) {
            inc(wordCounts, word);
        });
        getListFromString(account.note).forEach(function(word) {
            inc(wordCounts, word);
        });
        return wordCounts;
    }
    var inputWordCounts = countWordsForThisAccount(inputAccount);
    // compare
    var list = [];
    accounts.forEach(function(account) {
        var wordCounts = ids[account._id];
        account.score = score(inputWordCounts, wordCounts, totals);
    })
    return accounts.sort(function(x,y) { return y.score - x.score; });

};

function score(inputWC, wC, total) {
    var score = 0;
    for (var w in inputWC) {
        var otherCount = wC[w];
        if (otherCount) {
            score += inputWC[w] * otherCount / (total[w] * total[w]);
        }
    }
    return score;
}

function getListFromString(input) {
    return input ? input.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').split(' ') : [];
}

function inc(m, k) {
    if (m[k]) m[k] += 1;
    else m[k] = 1;
}

// ---------------------------------- END OF account match ----------------------------------------



// ----------------------------------- BEFORE UNLOAD ----------------------------------------

Orm.prototype.cacheFields = ['table', 'loadingTable', 'index', 'recordIndex', 'currentUser'];

Orm.prototype.cache = function() {
    var tableString = JSON.stringify(orm.table);
    if (tableString.length < 3) {
        localStorage.setItem('lastUnload', undefined);
        localStorage.setItem('orestmCache', undefined);
    } else {
        var orestmCache = {};
        orm.cacheFields.forEach(function(orestmField) {
            orestmCache[orestmField] = orm[orestmField];
        });
        localStorage.setItem('lastUnload', new Date().getTime());
        localStorage.setItem('orestmCache', JSON.stringify(orestmCache));
    }
};

Orm.prototype.tryCache = function() {
    var lastUnload = localStorage.getItem('lastUnload');
    if (new Date().getTime() - lastUnload < 3000) {
        var orestmCache = localStorage.getItem('orestmCache');
        orestmCache = orestmCache ? JSON.parse(orestmCache) : {};
        orm.cacheFields.forEach(function(orestmField) {
            orm[orestmField] = orestmCache[orestmField];
        });
    }
};

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

window.onbeforeunload = function() {
    // return "fix me in onbefore unload: should see if any loads or txs were in progress and not save if that was the case and only work for localhost";
    // return JSON.stringify(orm.loadingTable);
    var loads = false;
    Object.keys(orm.loadingTable).forEach(function(table){
        loads = loads || !isEmpty(orm.loadingTable[table].waitingOn)
    });
    if (orm.isLocalhost() && !orm.txs.length && !loads) {
        orm.cache();
    }
    // orm.unloadHooks.forEach(function(unloadHook) {
    //     unloadHook();
    // });
    if (orm.txs.length) {
        return 'You have unsaved changes.';
        //return 'The changes in your browser haven't been communicated with the database. CLOSING THE BROWSER COULD POTENTIALLY DESTROY ALL THE CHANGES YOU HAVE MADE.';
    }
};

        var orm = new Orm();
        orm.tryCache();
        window.orm = orm;
        return orm;
    }]);
