'use strict';
/* ORESTM
 * hide multiple async mess as below
 * provide uniform API to backend
 * provide indexed searches
 * provide query functionality
 * extensible to handle model logic to mirror what the backend would do 
 * mirrors backend to provide offlineability (keeps track of transactions) - eventually save these transactions in phone gap sort of way or indexDb
 */


 angular.module('nglogApp')
 .service('Orestm', ['util', function Orestm(util) {
        /* requires subclass to have
             schemas
             request
             genId
             idField
         */

var Orm = function() {
    this.txs = [];
    this.txsChangedCallbacks = [];
    this.label = '';
    this.txGroup = '';
    // byTable
    this.table = {};
    this.loadingTable = {};
    this.index = {};
    this.recordIndex = {};
    this.watchAllOn = {};
};

Orm.prototype.registerFixture = function(o) {
    this.schemas[o.name] = o.schema;
    this.table[o.name] = o.data;
};


Orm.prototype.callWatchAll = function(table,tx) {
    if (typeof this.watchAllOn[table] === 'undefined') { return; }
    var cbs = this.watchAllOn[table];
    for (var elementId in cbs) {
        if (document.getElementById(elementId) === null) {
            delete this.watchAllOn[table][elementId];
        } else {
            cbs[elementId](tx);
        }
    }
};

Orm.prototype.watchAll = function(table, elementId, callback) {
    if (typeof this.watchAllOn[table] === 'undefined') { this.watchAllOn[table] = {}; }
    if (typeof this.watchAllOn[table][elementId] === 'undefined') { this.watchAllOn[table][elementId] = {}; }
    // util.setMap(this.watchAllOn, table, element, callback);
    this.watchAllOn[table][elementId] = callback;
    // var self = this;
    // return (function(tbl, elemId/*,cb*/) { // this registration function returns a function that when called will deregister the thing
    //     return function () {
    //         delete self.watchAllOn[tbl][elemId];
    //     };
    // })(table, callback); // thing to deregister
};

Orm.prototype.labelTxsWith = function(label) {
    var O = function() { };
    O.prototype = this;
    var labeledOrestm = new O();
    labeledOrestm.label = label;
    return labeledOrestm;
}
Orm.prototype.beginTxGroup = function() {
    this.txGroup = this.genId();
};
Orm.prototype.endTxGroup = function() {
    this.txGroup = '';
};

Orm.prototype.makeRecordIndex = function(table) {
    if (typeof this.recordIndex[table] === 'undefined') {
        util.time('orestm.makeRecordIndex');

        var ri = {}, tbl = this.table[table], i;
        for (i = 0; i < tbl.length; i += 1) {
            ri[ tbl[i][this.idField] ] = tbl[i];
        }
        this.recordIndex[table] = ri;
        util.timeEnd('orestm.makeRecordIndex', table);
    }
};

Orm.prototype.query = function(table, criteria, options) {
    var o;
    if (typeof table === 'string') {
        o = {table : table, criteria : criteria};
        if (typeof options !== 'undefined') { o.options = options; }
    } else {
        o = table; // this is really an object
    }
    return util.clone(this.queryRefByObject(o));
};


Orm.prototype.queryRef = function(table, criteria, options) {
    var o;
    if (typeof table === 'string') {
        o = {table : table, criteria : criteria};
        if (typeof options !== 'undefined') { o.options = options; }
    } else {
        o = table; // this is really an object
    }
    return this.queryRefByObject(o);
};


Orm.prototype.queryRefByObject = function(o) {
    var tbl, rec, tbllen, res = [], i;
    util.time('orestm.queryRef');
    if (typeof o === 'undefined' || typeof o.table === 'undefined' || typeof o.criteria === 'undefined') { throw 'Orm: query called without options.table and/or options.record'; }
    tbl = this.table[o.table];
    if (typeof tbl === 'undefined') {
        util.log('fatal', 'orestm.queryRefByObject', 'you cannot call indexOn on a table that has not been loaded yet');
        return false;
    }

    if (typeof o.criteria === 'function') {
        tbllen = tbl.length;
        for (i = 0; i < tbllen; i += 1) {
            rec = {};
            if (o.criteria(tbl[i])) {
                res.push(tbl[i]);
            }
        }
    } else {
        throw 'Orestm: has not been designed to take criteria other than function(record) {}';
    }

    this.querySortSet = o.options && o.options.sort;
    if (this.querySortSet){
        res.sort(typeof querySortSet === 'function' ? this.querySortSet : this.queryDefaultSort.bind(this));
    }
    
    // pagination
    if(o.options && (o.options.start || o.options.count)){
        var total = res.length;
        res = res.slice(o.options.start || 0, (o.options.start || 0) + (o.options.count || Infinity));
        res.total = total;
    }
    util.timeEnd('orestm.queryRef', 'for ' + o.table);
    return res;
};

// Orm.prototype.isNumber = function(n) {
//   return !isNaN(parseFloat(n)) && isFinite(n);
// };

Orm.prototype.queryDefaultSort = function(a, b){
    var sort, aValue, bValue, i, aNValue, bNValue;
    for(sort, i=0; sort = this.querySortSet[i]; i++){
        aValue = a[sort.attribute];
        bValue = b[sort.attribute];
        // valueOf enables proper comparison of dates                                                                                             
        aValue = aValue != null ? aValue.valueOf() : aValue;
        bValue = bValue != null ? bValue.valueOf() : bValue;
        // cw CODE
        // !isNaN(parseFloat(n)) && isFinite(n);
        aNValue = parseFloat(aValue);
        bNValue = parseFloat(bValue);
        if (isNaN(aNValue) || isNaN(bNValue)) {
            aValue = util.nsLowerCase(aValue);
            bValue = util.nsLowerCase(bValue);
        } else if (isFinite(bValue) && isFinite(aValue)) {
        //if (this.isNumber(aValue) && this.isNumber(bValue)) {
            aValue = aNValue;
            bValue = bNValue;
        } else if (typeof aValue.toLowerCase === 'undefined') {
            debugger;
        } else {
            aValue = util.nsLowerCase(aValue);
            bValue = util.nsLowerCase(bValue);
        }
        // cw CODE
        if (aValue !== bValue){
            return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
        }
    }
    return 0;
};


Orm.prototype.getRef = function(table, id) {
    if (!this.recordIndex[table]) {
        this.makeRecordIndex(table);
    }
    return this.recordIndex[table][id];
};

Orm.prototype.getRefUnchecked = function(table,id) {
    return this.recordIndex[table][id];
};


Orm.prototype.getTableRef = function(table) {
    return this.table[table];
};

Orm.prototype.get = function(first, second) {
    if (typeof first === 'string') {
        return this.getByObject({table : first, id : second});
    } else {
        return this.getByObject(first);
    }
};

Orm.prototype.getByObject = function(o) {
    if (typeof o === 'string') {} // tablename .. the whole table, 
    if (typeof o === 'undefined' || typeof o.table === 'undefined')  { throw 'Orestm: addcalled without options.table and/or options.record'; }
    return util.clone(this.getRef(o.table, o.id));
    
    util.log('fatal', 'Orestm.get', 'when does orestm actually need to use a GET');
    return; // undefined b/c I couldn't find it but should have it.

    debugger;
    o.method = 'GET';
    o[this.idField] = o.id;
    delete o.id;
    this.pushTx(o);
    return; // most code throws an error
};




Orm.prototype.remove = function(first, second) {
    if (typeof first === 'string') {
        return this.removeByObject({table : first, id : second});
    } else {
        util.log('deprecated', 'orestm.remove');
        return this.removeByObject(first);
    }
};


Orm.prototype.removeByObject = function(o) {
    if (typeof o === 'undefined' || typeof o.table === 'undefined' || typeof o.id === 'undefined') throw 'Orestm: remove called without options.table and/or options.record';
    // VALIDATION cascading....
    var i;
    for (i = 0; i < this.table[o.table].length; i += 1) {
        if (o.id === this.table[o.table][i][this.idField]) {
            o.oldRecord = util.clone(this.table[o.table][i]);
            this.table[o.table].splice(i,1);
            break;
        }
    }
    o[this.idField] = o.id;
    delete o.id;
    o.method = 'DELETE';
    this.pushTx(o);
    return o;
};

Orm.prototype.add = function(first, second) {
    if (typeof first === 'string') {
        return this.addByObject({table : first, record : second});
    } else {
        util.log('deprecated', 'orestm.add');
        return this.addByObject(first);
    }
};


Orm.prototype.addByObject = function(o) {
    if (typeof o === 'undefined' || typeof o.table === 'undefined' || typeof o.record === 'undefined') throw 'Orestm: add called without options.table and/or options.record';
    // VALIDATION: loop thru args and if there's a function and it's not named onsuccess then throw a fit
    if (typeof o.record[this.idField] === 'undefined') { // set id on client side using newDate().getTime() + user._id set by subclass
        o[this.idField] = this.genId();
        o.record[this.idField] = o[this.idField];
    }
    // !!!getting pretty implementation specific
    if (typeof o.record.owner === 'undefined') { // set id on client side using newDate().getTime() + user._id set by subclass
        o.record.owner = this.currentUserId();
    }
    // update the frontend
    this.table[o.table].unshift(o.record); // put it in the front so they can see it.. of course this won't matter if they have it sorted or searched
    // update this.index for this.getIdsWhere
    for (var field in this.index[o.table]) {
        if (typeof this.index[o.table][field][o.record[field]] === 'undefined') {
            this.index[o.table][field][o.record[field]] = [o.record[this.idField]];
        } else {
            this.index[o.table][field][o.record[field]].push(o.record[this.idField]);
        }
    }
    // update this.recordIndex for this.get
    if (!this.recordIndex[o.table]) {
        this.makeRecordIndex(o.table);
    } else {
        this.recordIndex[o.table][ o.record[this.idField] ] = o.record;
    }
    // update on the backend
    o.method = 'POST';
    this.pushTx(o);
    return o;
};

Orm.prototype.put = function(first, second) {
    if (typeof first === 'string') {
        return this.putByObject({table : first, record : second});
    } else {
        return this.putByObject(first);
    }
};


Orm.prototype.putByObject = function(o) {
    if (typeof o === 'undefined' || typeof o.table === 'undefined' || typeof o.record === 'undefined') { throw 'Orestm: put called without options.table and/or options.record'; }
    // VALIDATION cascading....
    // VALIDATION is what they're giving me consistent with the schema??
    var i, f;
    for (i = 0; i < this.table[o.table].length; i += 1) {
        if (o.record[this.idField] === this.table[o.table][i][this.idField]) {
            o.oldRecord = util.clone(this.table[o.table][i]);
            for (f in o.record) { // update everything
                this.table[o.table][i][f] = o.record[f];
            }
            break;
        }
    }
    o[this.idField] = o.record[this.idField];
    o.method = 'PUT';
    this.pushTx(o);
    return o;
};

//public
Orm.prototype.onTxsChanged = function (callback) {
    if (typeof callback !== 'function') throw "Orm.prototype.onTxsChanged must take a function as a parameter";
    this.txsChangedCallbacks.push(callback);
};

// private
Orm.prototype.callTxsChangedCallbacks = function() {
    for (var i = 0; i < this.txsChangedCallbacks.length; i += 1) { this.txsChangedCallbacks[i](this.txs); }
};

Orm.prototype.isTxUnknown = function(tx) {
    if (typeof tx === 'undefined' || typeof tx.unique === 'undefined' || typeof tx.label === 'undefined') return true;
    for (var i = 0; i < this.txs.length; i += 1) {
        if (tx.unique === this.txs[i].unique) {
            return this.label !== tx.label;
        }
    }
    if (this.backendHasBulkExecutor) debugger; // should never get here
    return true;
};

Orm.prototype.pushTx = function(o) {
    o.unique = this.genId();
    o.txGroup = this.txGroup;
    o.label = this.label;
    this.txs.push(o);
    this.callTxsChangedCallbacks();
    this.executeTxs();
};

Orm.prototype.executeTxs = function() {
    var self = this, resource, k;
    if (this.backendHasBulkExecutor) {
        util.delay("bulkTxExecutor", 200, this.bulkPost.bind(this));
        // if (self.bulkTimeout) { clearTimeout(self.bulkTimeout); }
        // self.bulkTimeout = setTimeout(function () {
        //   self.bulkPost(self.txs);
        // });
    } else {
        for (var t = 0; t < this.txs.length; t += 1) {
            if (typeof this.txs[t].then !== 'undefined') { continue; } // skip over this tx as it's currently being tried

            (function (tx) {

                tx.then = function(success, data) {
                    var i;
                    if (success) {
                        if (typeof tx.onsuccess === 'function') {
                            tx.onsuccess(data);
                        }
                        // remove tx from txs
                        for (i = 0; i < self.txs.length; i += 1) {
                            if (self.txs[i].unique === tx.unique) {
                                console.log('orestm.executeTxs - callWatchAll')
                                setTimeout(self.callWatchAll.bind(self,self.txs[i].table, self.txs[i]));
                                self.txs.splice(i,1);
                                self.callTxsChangedCallbacks();
                                break;
                            }
                        } // for
                    } else { // failure
                        // option 1, current implementation)  just keep it on the txs array and execute it whenever it's back but hasn't been successful yet
                        delete tx.then;
                        //option 2: setTimeout(self.executeTxs, 2000); //ever so often
                    }
                };

                self.request(tx);
            })(this.txs[t]);

        }
    }
};


// Alternative API call - orestm.getFrom('account').where('name').is(importAccountName);
Orm.prototype.getIdsWhere = function(table, field, value) {
    //if (this.hasIndexFor(table,field)
    if (typeof this.index[table] === 'undefined' || typeof this.index[table][field] === 'undefined') {
        this.indexBetween(table, field, this.idField);
    }
    var a = this.index[table][field][value];
    return (typeof a === 'undefined') ? [] : a;
};


Orm.prototype.getIndexBetween = function(table, keyField, valueField) {
    if (typeof this.table[table] === 'undefined') {
        util.log('fatal', 'orestm.getIndexBetween', 'you cannot call indexOn on a table that has not been loaded yet');
        return false;
    }
    if (typeof this.index[table] === 'undefined') {
        this.index[table] = {}; 
    }
    if (typeof this.index[table][keyField] === 'undefined') {
        this.indexBetween(table, keyField, valueField);
    }
    return this.index[table][keyField];
};


Orm.prototype.indexBetween = function(table, keyField, valueField) {
    if (typeof this.table[table] === 'undefined') {
        util.log('fatal', 'orestm.indexBetween', 'you cannot call indexOn on a table that has not been loaded yet');
        return false;
    }
    if (typeof this.index[table] === 'undefined') {
        this.index[table] = {}; 
    }
    this.index[table][keyField] = {}; // discard old index by writing over it with an empty object
    var tbl = this.table[table], i,
    index = this.index[table][keyField];
    for (i = 0; i < tbl.length; i += 1) {
        if (typeof index[ tbl[i][keyField] ] === 'undefined') {
            index[ tbl[i][keyField] ] = [ tbl[i][valueField] ];
        } else {
            index[ tbl[i][keyField] ].push(tbl[i][valueField]);
        }
    }
    return index;
};
        
Orm.prototype.replaceIdInForeignKeys = function(tableNameForId, idToReplace, replacementId) {
    var tdata, fieldOpt;
    for (var tableName in this.schemas) {
        for (var field in this.schemas[tableName].fields) {
            fieldOpt = this.schemas[tableName].fields[field];
            if (fieldOpt.hasOwnProperty('table') && fieldOpt.table === tableNameForId) {
                // cycle thru table and replace ids
                tdata = this.table[tableName];
                for (var i = 0; i < tdata.length; i++) {
                    if (tdata[i][field] === idToReplace) {
                        tdata[i][field] = replacementId;
                        this.put({table:tableName, record: tdata[i] });
                    }
                }
            }
        }
    }
};


Orm.prototype.clearData = function() {
    var i, tbl;
    for (i = 0; i < this.tablesList.length; i += 1) {
        tbl = this.tablesList[i];
        delete this.table[tbl];
        delete this.loadingTable[tbl];
        delete this.index[tbl];
        delete this.recordIndex[tbl];
    }
};
Orm.prototype.refresh = function() {
    var self = this;
    this.clearData();
    this.whenLoaded(this.tablesList, function() {
        for (var i = 0; i < self.tablesList.length; i += 1) {
            // console.log('refreshed, calling watchers on ' + self.tablesList[i]);
            // self.callWatchAll(self.tablesList[i]); // this is already called within bulkhandler
        }
    });
};


Orm.prototype.whenLoaded = function(tablesWanted, callback) {
    var i, getTables = [], tbl;
    if (typeof tablesWanted === 'undefined') return callback();
    if (typeof tablesWanted === 'string') tablesWanted = [tablesWanted];
    if (typeof this.loadingTable === 'undefined') { this.loadingTable = {}; }
    if (typeof tablesWanted === 'function' && typeof callback === 'undefined') {
        callback = tablesWanted;
        tablesWanted = this.tablesList;
    }
    if (typeof tablesWanted[0] === 'undefined') return callback();
    var obj = {
        tablesWanted : tablesWanted,
        waitingOn : {},
        callback : callback
    };
    for (i = 0; i < tablesWanted.length; i += 1) {
        tbl = tablesWanted[i];
        if (typeof this.table[tbl] === 'undefined') { // don't have it
            obj.waitingOn[tbl] = true;
            if (typeof this.loadingTable[tbl] === 'undefined') { // not already getting it
                this.loadingTable[tbl] = [obj];
                this.pushTx({
                    table : tbl,
                    method : 'GET',
                    onsuccess : this._loadTable.bind(this, tbl)
                });
            } else { // already getting it
                this.loadingTable[tbl].push(obj);
            }
        }
    }
    if (Object.keys(obj.waitingOn).length === 0) { // already have all the tables, not waiting on any
        setTimeout(callback.bind(this,true));
    }
};

Orm.prototype._loadTable = function(tbl, data) {
    util.time('orestm._loadTable');
    // if (success) {
        this.table[tbl] = data;
        this.ensureRequiredDataExists(tbl);
        util.log('info', 'orestm.loadTable', tbl);
        // this.callWatchAll(tbl, undefined); // this is already called within bulkhandler
    // }
    var objs = this.loadingTable[tbl];
    var callbacksCalled = 0;
    for (var i = 0; i < objs.length; i++) {
        delete objs[i].waitingOn[tbl];
        // if (success) {
            if (Object.keys(objs[i].waitingOn).length === 0) {
                setTimeout(objs[i].callback.bind(this,true)); // need to setTimeout to avoid calling whenLoaded before the current load is over (b/c the current load will call watchAll so someone listening on whenLoaded shouldn't get a table load watchAll since that's what the whenLoaded is for)
                callbacksCalled++;
            }
        // } else {
        //   objs[i].callback(false);
        // }
    }
    util.timeEnd('orestm._loadTable', tbl.toUpperCase() + ' loaded and ' + callbacksCalled + ' callbacks called');
};

    return Orm;
}]);
