'use strict';

angular.module('nglogApp')
    .service('editable', ['util', function editable(util) {


var editable = function (options) {
    var self = this, i, f, field;
    this.options = options; // saved for recreation
    for (i in options) {
        if (i === 'schemas') {
            this.schemas = util.clone(options.schemas);
        } else {
            this[i] = options[i];
        }
    }

    this.txs = [];

    this.idToRow = {};
    this.idToActionsCell = {};
    this.idsHighlighted = [];
    this.insertControls = {};


    if (document.getElementById(this.containerId)===null) {
        util.log('fatal', 'editable.constructor', "You cannot create a table without passing it a valid div tag!");
        return self;
    } else {
        this.containerElem = document.getElementById(this.containerId);
        this.tableId = this.containerId+"_editable";
        this.headerId = this.containerId+"_editable_header";
    }
    // set defaults
    this.tableClass = this.tableclass || '';

    if (typeof this.matchIds !== "undefined") { this.showWhereIds = this.matchIdsOnTable(this.tablename); }
    if (typeof this.showWhere === "undefined" && typeof this.matchIds === "undefined") {
        this.showWhere = this.returnTrue;
    } else if (typeof this.showWhere === "undefined" && typeof this.matchIds !== "undefined") {
        this.showWhere = this.showWhereIds;
    } else if (typeof this.showWhere !== "undefined" && typeof this.matchIds !== "undefined") {
        this.oldShowWhere = this.showWhere;
        this.showWhere = function (record) { return this.oldShowWhere(record) && this.showWhereIds(record) };
    } else {  // leave this.showWhere b/c matchId isn't defined.. this was a user definition
    }
    if (typeof this.disableWhere === "undefined") { this.disableWhere = this.returnFalse; }
    if (typeof this.validatePost === "undefined") { this.validatePost = this.returnTrue; }
    if (typeof this.recordLimit == "undefined") { this.recordLimit = 12; }
    if (typeof this.pivot == "undefined") { this.pivot = false; }
    // if (typeof this.getNextId == "undefined") { this.getNextId = function () { return (new Date().getTime()).toString()+this.db.getState().userId.toString() }; }

    this.actionButtons = 0;
    if (typeof this.crud === 'undefined' || this.crud) { // this is the default
        this.crudHidden = this.crudHidden || false;
        this.actionButtons += 2; // assume remove and add
        if (typeof this.disableRemove !== 'undefined' && this.disableRemove) {
            if (typeof this.removeClass !== 'undefined') { throw "Editable: disableRemove and removeButton are conflicting options"; }
            this.disableRemoveWhere = function (record) { return true; };
            this.actionButtons -= 1;
        }
        this.removeClass = this.removeClass || '';
        this.addClass = this.addClass || '';

        if (typeof this.disableAdd !== 'undefined' && this.disableAdd) {
            if (typeof this.addButton !== 'undefined') { throw "Editable: disableAdd and addButton are conflicting options"; }
            this.actionButtons -= 1;
        }

        if (typeof this.saveButton !== typeof this.cancelSaveButton) { throw "Editable: saveButton && cancelSaveButton must be specified together"; }
        if (typeof this.saveButton !== 'undefined') { this.actionButtons += 2; } // only show up when in active edit

        if (typeof this.editButtonHTML !== 'undefined') { this.actionButtons += 1; }

        if (typeof this.selectedButton !== 'undefined') {
            this.actionButtons += 1; // can have a selected Button without an unselected button
        } else if (typeof this.unselectedButton !== 'undefined') { // no selected button but an unselectedButton
            throw "Editable: if you have an unselectedButton, you should also have a selectedButton";
        }
        //if (this.rowClick === this.EDIT && this.) {



        if (typeof this.select === "undefined" || this.select === 'buttons') {
            this.actionButtons += 1;
        //} else if (this.select === 'highlight') {
        }
        if (this.rowClick === 'edit') {
//      this.actionButtons -= 1;
        }

    } else { // this.crud === false
        this.disableRemoveWhere = function (record) { return true; };
        this.disableAdd = true;
        this.disableEdit = true;
    }

    if (typeof this.onselect !=='undefined') {
        // select button is implied -- UPDATE it could be the highlight too
        // this.actionButtons += 1;
        //this.selectbutton
    }

    //if (se(this.select) === 'button') {
    // if (typeof this.onselect !== 'undefined') {
    // if (typeof this.select !== 'undefined' && this.select === 'buttons') {
    //   this.actionButtons += 1;
    // }

    this.actionsLayout = this.actionsLayout || 'first';
    if (this.actionButtons === 0) { this.actionsLayout = 'none'; } // since it's not first or last then it won't show up


    // develop options that are orthogonal and mostly can't conflict
    // detect and throw errors when options conflict
    // convert options into procedures for running
    this.actionButtons = 1;



    if (!this.tablename && !this.schemas[this.tablename]) return; // prevent error when no schema is provided
    this.primaryKey = this.schemas[this.tablename].primaryKey;

    // fill in fieldOrder for all fields ***************************
    for (field in this.schemas[this.tablename].fields) {
        for (f in this.schemas[this.tablename].fieldOrder) {
            if (this.schemas[this.tablename].fieldOrder[f] == field) {
                f = "FOUND";
                break;
            }
        }
        if (f != "FOUND") {
            // not found so add this to the end of fieldOrder
            this.schemas[this.tablename].fieldOrder.push(field);
        }
    }

    // hideFields helper option
    for (f = 0; typeof this.hideFields !== "undefined" && f < this.hideFields.length; f++) {
        this.schemas[this.tablename].fields[ this.hideFields[f] ].display = "none";
    }

    // disable helper options
    if (typeof this.disableSearch == "object") {
        for (f in this.disableSearch) {
            if (this.schemas[this.tablename].fields[ this.disableSearch[f] ].display !== "none") {
                this.schemas[this.tablename].fields[ this.disableSearch[f] ].display = "disableSearch";
            }
        }
    }
    if (typeof this.disableSearchAndEdit == "object") {
        for (f in this.disableSearchAndEdit) {
            if (this.schemas[this.tablename].fields[ this.disableSearch[f] ].display !== "none") {
                this.schemas[this.tablename].fields[ this.disableSearchAndEdit[f] ].display = "disableSearchAndEdit";
            }
        }
    }
    if (typeof this.disableEdit == "object") {
        for (f in this.disableEdit) {
            if (this.schemas[this.tablename].fields[ this.disableSearch[f] ].display !== "none") {
                this.schemas[this.tablename].fields[ this.disableEdit[f] ].display = "disableEdit";
            }
        }
    }

    if (typeof this.searchOnClear == "undefined") {
        this.searchOnClear = {};
    }
    // calculate sql_search_fields
    this.sql_search_fields = {};
    for (f in this.schemas[this.tablename].fieldOrder) {
        field = this.schemas[this.tablename].fieldOrder[f];

        // disable booleans but not search b/c that would override display == "none"
        if (typeof this.disableSearchAndEdit == "boolean" && this.disableSearchAndEdit == true && this.schemas[this.tablename].fields[field].display !== "none") {
            this.schemas[this.tablename].fields[field].display = "disableSearchAndEdit";
        } else if (typeof this.disableEdit == "boolean" && this.disableEdit == true && this.schemas[this.tablename].fields[field].display !== "none") {
            this.schemas[this.tablename].fields[field].display = "disableEdit";
        }

        // search fields
        if (typeof this.searchOnClear[field] == "undefined") {
            if (typeof this.schemas[this.tablename].fields[field].editableSearchOnClear == "undefined") {
                this.searchOnClear[field] = "";
            } else {
                this.searchOnClear[field] = this.schemas[this.tablename].fields[field].editableSearchOnClear;
            }
        }
        this.sql_search_fields[field] = this.searchOnClear[field];
    }

    this.search_elements = {}

    // constructor options
//  this.dependency = ["jquery", "chosen", "dojo"];

    // internally set to constant for now, until set by the objects operations
    this.tbl_updating_value = "";
    this.tbl_updating_col = 0;
    this.tbl_focus_row = 1;
    this.tbl_focus_col = 0;
    this.key_already_down = false;
    this.tbl_rows = 0;
    this.tbl_cols = 0;
    this.recordHeader = -2;
    this.recordSearchInsert = -1;


    // can be set directly by the user
    this.textarea_always_expanded = false;
    this.use_chosen = false; // default = false, speed up load by 700%
    this.use_datepicker = false;


    // programmatic css for quicker loads
    var element = document.createElement("style");
    element.type = "text/css";
//  element.innerHTML = "table td, table th{ vertical-align:middle; padding: 1px; white-space:nowrap; border : 1px black solid;}";
    element.innerHTML = '.table > tbody > tr > td.highlightedrow {background-color : yellow;} table > tbody > tr > td.highlightedrow {background-color : yellow;}';
    document.getElementById(this.containerId).appendChild(element);

//    document.getElementById(this.containerId).innerHTML += "<style type='text/css'>table td, table th{ \
//      vertical-align:middle; padding: 0; /* 'cellpadding' equivalent */ \
//      white-space:nowrap;}</style>";
//    $("#"+this.containerId).append("<style type='text/css'>table td, table th{"
//      + "vertical-align:middle; padding: 0; /* 'cellpadding' equivalent */"
//      + "white-space:nowrap;}</style>");

    // sticky header
    // element = document.createElement("div");
    // element.id = 'myheader';
    // //element.innerHTML = "This is my sticky header, I'm testing whether I can make them scroll horizontally at the same time.";
    // element.style.position = "relative";
    // element.style.top = "0px";
    // element.style.background = "rgba(255,255,255,1)";
    // element.style.zIndex = "1";
    // this.headerDivElem = element;
    this.divheaderLastUpdated = (new Date()).getTime();
    //this.containerElem.appendChild(element);
    // $(document.getElementById(this.containerId)).on('scroll',function(e){
    //   if ((new Date()).getTime() - self.divheaderLastUpdated > 10) { // this is about 100 frames per second which eliminates flicker while doing as little as possible
    //     var st = $(document.getElementById(self.containerId)).scrollTop();
    //     $(self.headerDivElem).css('top', st + 'px');
    //     self.divheaderLastUpdated = (new Date()).getTime();
    //   }
    // });
    // create header table
    element = document.createElement("table");
    element.id = this.headerId;
    element.className = this.tableClass.replace(new RegExp('table[^-]'), '');


    element.style.position = "relative";
    element.style.top = "0px";
    element.style.background = "rgba(255,255,255,1)";
    element.style.zIndex = "1";

    this.headerElem = element;
    this.containerElem.appendChild(element);

    $(document.getElementById(this.containerId)).on('scroll',function(e){
        if ((new Date()).getTime() - self.divheaderLastUpdated > 10) { // this is about 100 frames per second which eliminates flicker while doing as little as possible
            var st = $(self.containerElem).scrollTop();
            $(self.headerElem).css('top', st + 'px');
            self.divheaderLastUpdated = (new Date()).getTime();
        }
    });


    // create table
    element = document.createElement("table");
    element.id = this.tableId;
    element.className = this.tableClass;
    this.containerElem.appendChild(element);
    this.tableElem = element;

    this.recordLimitElem = document.createElement("div");
    this.containerElem.appendChild(this.recordLimitElem);


// // go back to the way it was
//   this.headerElem = this.tableElem;
//   this.headerId = this.tableId;
    //

//    $("#"+this.containerId).append("<table id='"+this.tableId+"'></table>");

    // create div tags for debugging
    // element = document.createElement("div");
    // element.id = this.tableId + "-debugger-url";
    // element.style.display = "none";
    // document.getElementById(this.containerId).appendChild(element);
    // element = document.createElement("div");
    // element.id = this.tableId + "-debugger-alert";
    // element.style.display = "none";
    // document.getElementById(this.containerId).appendChild(element);
    // element = document.createElement("div");
    // element.id = this.tableId + "-debugger-json";
    // element.style.display = "none";
    // document.getElementById(this.containerId).appendChild(element);
//    $("#"+this.containerId).append("<div id='tbl-debugger' style='display:none;'><p><div id='tbl-debugger-url'></div></p><p><div id='tbl-debugger-alert'></div></p><p><div id='tbl-debugger-json'></div></p></div>");

    // bind event handlers with self context // b/c window.event is equivalent to the this event context
    self.onkeyupSearch = self.onkeyupSearch.bind(self);
    self.onPut = self.onPut.bind(self);
    self.onFocus = self.onFocus.bind(self);


    // populate table
//  this.db.addObserver(function () { self.query(); });
    this.query();

    // crude
    /*this.removeWatcher = */this.db.watchAll(this.tablename, this.containerId, function (tx) {
        for (var i = 0; i < self.txs.length; i += 1) {
            if (tx.unique === self.txs[i].unique) {
                return;
            }
        }
        self.delay(self.query);
    });


    // NAVIGATING THE TABLE
    this.containerElem.onkeyup = function (e){
        self.key_already_down = false;
        return true;
    };
//  $(document).on("keyup", function (e){ self.key_already_down = false; return true;  } );
    this.containerElem.onkeydown = function (event){
        event = event || window.event;
        if (self.on_keydown(event.altKey, event.which) === false) {
            event.stopPropagation();
            event.preventDefault();
        }
    };
//  $(document).on("keydown", function (e) { self.on_keydown(e.altKey, e.which); });

    this.nextUndoIndex = -1; // b/c nothing to undo yet

}; // end of constructor


editable.prototype.Recreate = function(options) {
    // this.removeWatcher();
    $(this.containerElem).empty();
    return new editable(options);
};


editable.prototype.pushTx = function(tx) {
    if (this.undoType === 'word' || this.undoType === 'vim') {
        // if they've been undoing then get rid of the txs of them undoing and of them originally typing the stuff that they just undo'ed b/c they don't want it anymore
        this.txs = this.txs.slice(0,this.nextUndoIndex + 1);
        this.redoButton.style.opacity = '0.5';
    }
    this.nextUndoIndex = this.txs.length;
    this.undoButton.style.opacity = '1';
    this.txs.push(tx);
};

editable.prototype.undo = function () {
    var oldUndoIndex = this.nextUndoIndex;
    if (this.nextUndoIndex < 0) {
        // fail silently after all the button is greyed // alert("There is nothing else to undo.");
    } else {
        if (this.undoType === 'vim' || this.undoType === 'word') {
            this.nextUndoIndex = this.txs.length -1; // I have to setup this variable so that the pushTx this.txs.slice doesn't cut off any actions in the undo stack
            this.executeInverseTx(this.txs[oldUndoIndex]);
            this.txs.pop();
        } else if (this.undoType === 'emacs') {
            this.executeInverseTx(this.txs[this.nextUndoIndex]);
        }
        this.nextUndoIndex = oldUndoIndex - 1; // -1 b/c I want to undo the next one next and -1 again b/c I just incremented it by pushTx
        this.redoButton.style.opacity = '1';
        if (this.nextUndoIndex < 0) {
            this.undoButton.style.opacity = '0.5';
        }
        this.delay(this.query);
    }
};

editable.prototype.redo = function () {
    var oldUndoIndex = this.nextUndoIndex;
    if (this.nextUndoIndex !== this.txs.length - 1) {
        this.nextUndoIndex = this.txs.length - 1; // neutralizes the effect of pushTx()'s this.txs.slice for vim/word
        this.executeTx(this.txs[oldUndoIndex + 1]);
        this.txs.pop(); // undo the add of the redo tx to the stack b/c I want to eventually get to the end of redoing things
        this.nextUndoIndex = oldUndoIndex + 1; // -1 b/c I want to undo the next one next and -1 again b/c I just incremented it by pushTx
        this.undoButton.style.opacity = '1';
        if (this.nextUndoIndex === this.txs.length - 1) {
            this.redoButton.style.opacity = '0.5';
        } else {
            this.redoButton.style.opacity = '1';
        }
        this.delay(this.query);
    }
/*
    oldUndoIndex
    this.nextUndoIndex = oldUndoIndex - 1; // -1 b/c I want to undo the next one next and -1 again b/c I just incremented it by pushTx
    // implied // if (this.undoType === 'word' || this.undoType === 'vim') {
    this.txs = this.txs.slice(0,this.nextUndoIndex + 1);
    if (this.nextUndoIndex + 1
    this.redoButton.style.opacity = '0.5';
    */
};

editable.prototype.executeInverseTx = function (tx) {
    switch (tx.method) {
    case 'POST':
        this.pushTx(this.db.remove(this.tablename, tx.record[this.schemas[this.tablename].primaryKey]));
        break;
    case 'PUT':
        this.pushTx(this.db.put(this.tablename, tx.oldRecord));
        break;
    case 'DELETE':
        this.pushTx(this.db.add(this.tablename, tx.oldRecord));
        break;
    default:
        alert("programmer error: editable.prototype.undo, there should never be a method that is not PUT, POST, DELETE");
        debugger;
    };
};

editable.prototype.executeTx = function (tx) {
    switch (tx.method) {
    case 'POST':
        this.pushTx(this.db.add(this.tablename, tx.record)); // keeps same id b/c b/c this.db.add looks for existing IDs before assigning a new one
        break;
    case 'PUT':
        this.pushTx(this.db.put(this.tablename, tx.record));
        break;
    case 'DELETE':
        this.pushTx(this.db.remove(this.tablename, tx[this.schemas[this.tablename].primaryKey]));
        break;
    default:
        alert("programmer error: editable.prototype.undo, there should never be a method that is not PUT, POST, DELETE");
        debugger;
    };
};

editable.prototype.matchIdsOnTable = function (table) {
    var self = this;
    // returns a function
    if (typeof this.matchIds === "undefined") {
        return this.returnTrue;
    }
//  return (function (table) {
        return function (record) {
            var id, matched = true, matchesOne = false, i;
            for (id in self.matchIds) {
                if (id === "ownerId" && table === "user") {
                    matched = matched && (self.matchIds[id].indexOf(record.id) !== -1);
                } else if (id === "ownerId" && table === "sectionUser") {
                    matched = matched && (self.matchIds[id].indexOf(record.teacherId) !== -1);
                } else if (typeof record[id] !== "undefined" || id.slice(0, id.length - 2) === table) {

//        if (id.slice(0, id.length - 2) === table) { // this is the "id"
// TURNS OUT I DON"T WANT THIS B/C then i can't change the parent.. if they want to select a particular id, then they should showWhere = function (record) { return (record.id == "19083"); },
//         matched = matched || (record.id == self.matchIds[id]);

                    // now am I supposed to match just one id or a whole array?
                    if (typeof self.matchIds[id] === "object") { // match a whole array
                        matchesOne = false;
                        for (i = 0; i < self.matchIds[id].length; i += 1) {
                            if (id.slice(0, id.length - 2) === table) { // this is the "id"
                                matchesOne = matchesOne || (record.id == self.matchIds[id][i]);
                            } else {
                                matchesOne = matchesOne || (record[id] == self.matchIds[id][i]);
                            }
                        }
                        matched = matched && matchesOne;
                    } else { // just one record
                        if (id.slice(0, id.length - 2) === table) { // this is the "id"
                            matched = matched && (record.id == self.matchIds[id]);
                        } else {
                            matched = matched && (record[id] == self.matchIds[id]);
                        }
                    }
                }
            }
            return matched;
        };
//  })(table);
};

editable.prototype.getSelected = function() {
    // alert('editable.prototype.getSelected is deprecated');
    // debugger;
    return this.idsHighlighted;
};
editable.prototype.clearSelected = function() {
    var i, rows = []; // I have to save up rows then 'un'select them b/c this.selectRow affects this.idsHighlighted
    for (i = 0; i < this.idsHighlighted.length; i += 1) {
        rows.push(this.idToRow[ this.idsHighlighted[i]]);
    }
    for (i = 0; i < rows.length; i += 1) {
        this.selectRow.call(this, { currentTarget : rows[i] });
    }
};
editable.prototype.select = function(input) {
    if (typeof input === 'undefined') { // getter
        return this.idsHighlighted;
    } else if (typeof input === 'string') {
        this.selectId(input);
    } else if (typeof input === 'object' && input !== null) {
        for (var i = 0; i < input.length; i += 1) {
            this.selectId(input[i]);
        }
    }
};

editable.prototype.selectId = function(id) {
    row = this.idToRow[id];
    if (row === 'undefined') {
        alert('Editable: The id you\'ve tried to select does not exist in this table');
    } else {
        $(this.containerElem).animate({scrollTop : $(row).offset().top - $(this.tableElem).offset().top }, 'fast');
        if (this.idsHighlighted.indexOf(id) === -1) {
            this.selectRow.call(this, {currentTarget : row});
        }
    }
};

editable.prototype.returnTrue = function () { return true; };
editable.prototype.returnFalse = function () { return false; };

editable.prototype.destroy = function () {
};

//============================== User interface functions ===============================

editable.prototype.searchOn = function (o) {
    for (var f in o) {
        //if (typeof(this.sql_search_fields[f])!="undefined")
        this.sql_search_fields[f] = o[f];
    }
    this.query();
    // let the user know I'm searching on this
    if (typeof(this.onsearch) == "function") this.onsearch.call(this, this.sql_search_fields);
};

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// query data get data to loopable json
//    perhaps use this.sql_search_fields as a parameter instead of an object variable
editable.prototype.query = function () {
    util.time('editable.query');
    var redraw_search, self = this,
        f, field, fReturnTrue, fieldOpt,
        auxTbl;
    if (self.headerElem.rows.length===0) { // just get the data once //this.tbl_rows
        redraw_search=true;  // redraw search on initialization only??
    } else { // return visit queries
        redraw_search = false;
        this.setSearchFieldsFromElements();
    }
    this.data = {};
    // not put under data[this.tablename] because it could have a combo box that refers to the same table as for owners of user or forkedFromId
    this.data.grid = this.db.query(this.tablename, this.queryWhere.bind(this), {
        sort: this.schemas[this.tablename].recordOrder,
        start: 0,
        count: this.recordLimit+1
    });
    // find all field displays that start with "combo "
    for (f in this.schemas[this.tablename].fieldOrder) {
        field = this.schemas[this.tablename].fieldOrder[f];
//    if (field === "ownerId") debugger;
        fieldOpt = this.schemas[this.tablename].fields[field];
        if (fieldOpt.type === 'inTable') {
            // make a query for each of them
            auxTbl = fieldOpt.table
            this.data[auxTbl] = this.db.query(auxTbl, this.matchIdsOnTable(auxTbl), {
                sort: this.schemas[auxTbl].recordOrder,
//        start: 0,
//        count: this.recordLimit+1
            });
        }
    }
    // eventually i need to care about the ordering
    // deal with combo group eventually
    // certain selections, pick only a teacher user, pick only a student user of my own...
    // fieldOpt.multiple selects??
    this.redrawGrid(this.data, redraw_search);
    util.timeEnd('editable.query');
};

editable.prototype.queryWhere = function (record) {
        var self = this, s, field, i, j, ar, match;
        if (self.idsHighlighted.indexOf(record[self.schemas[self.tablename].primaryKey]) !== -1) { return true; }
        for (field in self.sql_search_fields) { // TABLE SEARCH // not self.dbStructure[table] b/c i only want to go thru the criteria I'm given
            // attempt to disqualify
            s = self.sql_search_fields[field];
            if (typeof s === 'undefined' || s === "" || s.length === 0) { continue; }
            if (typeof record[field] === 'undefined' || record[field] === null) return false;
            if (self.schemas[self.tablename].fields[field].multiple) {
                s = (typeof s === 'string') ? s.split(',') : s;
                for (i = 0; i < s.length; i += 1) {
                    if (typeof record[field] === 'string') {
                        ar = record[field].split(',');
                        if (ar[0] === '') ar = [];
                    } else if (typeof record[field] === 'object') {
                        ar = record[field]
                    } else {
                        alert('debugger');
                        debugger;
                    }
                    for (j = 0; j < ar.length; j += 1) {
                        if (s[i] === ar[j]) {
                            // one match and we're good - this is an 'or'
                            return self.showWhere(record);
                        }
                    }
                }
                if (s.length !== 0) return false; // no match
                else continue;
            } else if (self.schemas[self.tablename].fields[field].type === 'datatime') {
                // s = new Date(s); // for complete dates
                //debugger;
            }
            s = s.toLowerCase();
            ar = s.split('||');
            if (ar.length !== 1) {
                match = false;
                for (var i = 0; i < ar.length; i += 1) {
                    if (record[field].toLowerCase().indexOf(ar[i].trim()) !== -1) { match = true; break; }
                }
                if (!match) { return false; }
            } else if (s[0] === '^') {
                if (s.length > 1 && record[field].slice(0,  s.length-1).toLowerCase() !== s.slice(1)) return false;
            } else if (s[0] === '!') {
                record[field] = record[field].toString();
                if (s.length > 1 && record[field].toLowerCase().indexOf(s.slice(1)) !== -1) return false; // not
            } else if (s[0] === '<' || s.slice(0,2) === '< ') {
                if (isNumber(s.slice(1))) {
                    if (parseFloat(record[field]) >= parseFloat(s.slice(1))) return false;
                }
            } else if (s[0] === '~' || s.slice(0,2) === '< ') {
                if (isNumber(s.slice(1))) {
                    if (parseFloat(record[field]) > parseFloat(s.slice(1)) * 1.1) return false;
                    if (parseFloat(record[field]) < parseFloat(s.slice(1)) * 0.9) return false;
                }
            } else if (s[0] === '>' || s.slice(0,2) === '> ') {
                if (isNumber(s.slice(1))) {
                    if (parseFloat(record[field]) <= parseFloat(s.slice(1))) return false;
                }
            } else if ( (i = s.indexOf('~')) !== -1) {
                var n = s.slice(0, i);
                if (isNumber(n) && (s.length - 1 === i || !isNumber(s.slice(i + 1)) )) { // no plus/minus so look for exact match
                    if (typeof record[field] === 'undefined' || record[field].toLowerCase().indexOf(s.replace('~', '')) == -1) return false;
                } else {
                    p = parseFloat(s.slice(i + 1));
                    if (parseFloat(record[field]) > n * (1+p)) return false;
                    if (parseFloat(record[field]) < n * (1-p)) return false;
                }
            } else {
                // if (isNumber(s) && isNumber(record[field]) && record[field].toString().indexOf) return false;
                record[field] = record[field].toString();
                if (record[field].toLowerCase().indexOf(s) == -1) return false;
            }
        }
        return self.showWhere(record);
};


//=========================== interface with api resources ==============================
function indexAction() { // GET /data/
}
// i should never need to use this b/c I'll always have the entire table cached
editable.prototype.getRecord = function() { // GET /data/32
};

// INSERT new record b/c id=32 doesn't exist yet, it will be assigned in the post
editable.prototype.postRecord = function () { // POST /data/
    var field, field_id, fieldOpt, record = {}, fieldsAlsoGetPrimaryKey = [];
    this.tbl_focus_row = 1; this.tbl_focus_col = 0;

    var newPrimaryKey = this.db.genId(); // put it in this order

        // get info
    for (var f in this.schemas[this.tablename].fieldOrder) {
        field = this.schemas[this.tablename].fieldOrder[f];
        field_id = this.headerId + "," + field;
        fieldOpt = this.schemas[this.tablename].fields[field];
        if (fieldOpt.type=="combo" && fieldOpt.table === this.tablename && (document.getElementById(field_id).value == "SELF" || document.getElementById(field_id).value == "")) {
            record[field] = newPrimaryKey; // fieldsAlsoGetPrimaryKey.push(field);
        } else if (fieldOpt.type=="xcombo") {
            record[field] = $("#"+field_id).val().join(",");
        } else if (fieldOpt.type == "timestampOnUpdate") {
            // to support timestampOnUpdate, search for that fieldOpt.type and then update that record to now
            record[field] = dateJStoMYSQL(new Date());
        } else if ((fieldOpt.type === "seq" || fieldOpt.type === "smallint")) {
//      console.log(isNaN(document.getElementById(field_id).value));
            record[field] = Number(document.getElementById(field_id).value);
        } else {
            record[field] = document.getElementById(field_id).value;
        }
        if ((field.indexOf("_id") !== -1 || field=="type") &&  record[field] === "") {
            alert("You must choose a " + field + " before inserting!");
            return;
        }
        // clear non select fields ### this conditional is broken
        if (typeof(this.sql_search_fields[field])!="undefined")
            $("#"+field_id).val(this.sql_search_fields[field]);
        else throw "editable.postRecord typeof sql_search_fields[field]=='undefined'";

        // jquery objects need to be cleared in a certain way
        if ($("#"+field_id).hasClass("chzn-select") || $("#"+field_id).hasClass("chzn-select-deselect")) $("#"+field_id).trigger("liszt:updated");
        if ($("#"+field_id).hasClass("cwdt")) updateCWDTfromHidden (field);
    }
    record[this.primaryKey] = newPrimaryKey;

    // frontend
    if (this.validatePost(record)) {
        // if (this.tablename == "user") {
        //   this.db.regUser(record);
        // } else {
        this.pushTx(this.db.add(this.tablename, record));
        // }
        this.setSearchFieldsToSearchOnClear(); // Should insert clear the whole search fields???###
        // this.setSearchElementsFromFields();
        this.query(); // update the screen
    } else {
        // do nothing
    }
    if (this.pivot) {
        this.tbl_focus_row = 0; this.tbl_focus_col = 1;
    } else {
        this.tbl_focus_row = 1; this.tbl_focus_col = 0;
    }
};


editable.prototype.rowsIds = function() {
    var r, res = [];
    for (r = 0; r < this.tableElem.rows.length; r += 1) {
        res.push(this.tableElem.rows[r]['data-id']);
    }
    return res;
};


// UPDATE
editable.prototype.putRecord = function (id, input_field, input_value) {
    var record, field, f;
    //  if (this.tbl_updating_node === this_node && this.tbl_updating_value == this_node.value) return;
    //if (this.tbl_updating_value == input_value) return; // nothing's changed ?? problematic b/c this doesn't work???

    // update frontend but no need to redisplay since user changed it
    record = this.db.get(this.tablename, id);
    if (record[input_field] === input_value) { return; } // b/c nothing's changed

    record[input_field] = input_value;


    // // to support timestampOnUpdate, search for that editableType and then update that record to now
    // for (f in this.schemas[this.tablename].fieldOrder) {
    //   field = this.schemas[this.tablename].fieldOrder[f];
    //   if (this.schemas[this.tablename].fields[field].type == "timestampOnUpdate") {
    //     record[field] = dateJStoMYSQL(new Date());
    //     break;
    //   }
    // }

    var tx = this.db.put(this.tablename, record);
    this.txs.push(tx);
//  this.query(); // update the screen.... while the user has already updated it, it needs this to set the focus to the right thing

/*
    //set focus
*/
};


// DELETE
editable.prototype.deleteRecord = function (id) { // DELETE /data/32
    var self = this;
    this.pushTx(this.db.remove(this.tablename, id));
    this.query();
};


// ========================= Implementation functions ===================================
editable.prototype.setSearchElementsFromFields = function () {
    var f, field;
    for (f in this.schemas[this.tablename].fieldOrder) { // TABLE SEARCH
        field = this.schemas[this.tablename].fieldOrder[f];
        if (typeof this.sql_search_fields[field] === 'undefined') { this.sql_search_fields[field] = ''; }
        else {
            this.insertControls[field].val(this.sql_search_fields[field]);
            if (typeof this.insertControls[field].trigger === 'function') {
                this.insertControls[field].trigger("change");
            }
        }
    }
};

editable.prototype.setSearchFieldsFromElements = function () {
    var f, field;
    for (f in this.schemas[this.tablename].fieldOrder) { // TABLE SEARCH
        field = this.schemas[this.tablename].fieldOrder[f];
        if (this.schemas[this.tablename].fields[field].multiple) {
            this.sql_search_fields[field] = $(document.getElementById(this.headerId + "," + field)).val();
            if (this.sql_search_fields[field] === null) { this.sql_search_fields[field] = []; }
        } else {
            if (document.getElementById(this.headerId + "," + field)=== null) { debugger; }
            this.sql_search_fields[field] = document.getElementById(this.headerId + "," + field).value;
        }

/*
        // for disableSearch and disableSearchAndEdit
        if (typeof this.disableSearch == "boolean") {
            return;
        } else if (typeof this.disableSearch == "object") {
            for (f in this.disableSearch) {
                if (field == this.disableSearch[f]) { break; }
            }
            if (field == this.disableSearch[f]) { continue; }
        }
        if (typeof this.disableSearchAndEdit == "boolean") {
            return;
        } else if (typeof this.disableSearchAndEdit == "object") {
            for (f in this.disableSearchAndEdit) {
                if (field == this.disableSearchAndEdit[f]) { break; }
            }
            if (field == this.disableSearch[f]) { continue; }
        }
*/

//    if (typeof document.getElementById(this.tableId + "," + field).value == "undefined") {
//      this.sql_search_fields[field] = document.getElementById(this.tableId + "," + field).innerHTML;
//    } else {
//    }
    }
};

editable.prototype.clear_searches = function () {
    if (race_condition) return;
    this.setSearchFieldsToSearchOnClear();
    this.tbl_focus_row = 1; this.tbl_focus_col = 0;
    this.query();
    // let the user know I'm searching on this
    if (typeof(this.onsearch) == "function") this.onsearch(this.sql_search_fields);
};


editable.prototype.table_search_change = function (field_name, field_id,this_node) {
    var id_split, f;
    //if (this.tbl_updating_node === this_node && this.tbl_updating_value == this_node.value) return; // nothing's changed ?? problematic b/c this doesn't work?
    if (this.sql_search_fields[field_name] === this_node.value) { return; }
/*
    // for disableSearch and disableSearchAndEdit
    if (typeof this.disableSearch == "boolean") {
        return;
    } else if (typeof this.disableSearch == "object") {
        for (f in this.disableSearch) {
            if (field_name==this.disableSearch[f]) return;
        }
    }
    if (typeof this.disableSearchAndEdit == "boolean") {
        return;
    } else if (typeof this.disableSearchAndEdit == "object") {
        for (f in this.disableSearchAndEdit) {
            if (field_name==this.disableSearchAndEdit[f]) return;
        }
    }
*/
    // just continue on searching since it wasn't disabled
    this.tbl_updating_value = this_node.value;
    this.tbl_updating_node = this_node;
    var id_split = this_node.parentNode.id.split(",");
    if (typeof id_split[1] === 'undefined') {
        debugger;
    }
    this.tbl_focus_row = id_split[1]; this.tbl_focus_col = id_split[2];

    this.delay(this.query);
    //this.query();

    // let the user know I'm searching on this
    if (typeof(this.onsearch) == "function") this.onsearch.call(this, this.sql_search_fields);
};

editable.prototype.delay = function (func) {
    var self = this;
    if(self.timeout) { clearTimeout(self.timeout); }
    func = func.bind(this);
    self.timeout = setTimeout(function () {
        func();
    }, 500);
};

// editable.prototype.delay = function (func) {
//   var waitTime = 250, extraWait = 10, debug = false, self = this, now = (new Date).getTime();
//   if (debug) console.log('delay called');
//   self.lastDelay = (new Date).getTime();
//   if (self.lastRedrawSet) { return; } // why set it again, it will already redraw after this?
//   func = func.bind(this);
//   self.lastRedrawSet = true;
//   setTimeout(self.delayExecuteLater.bind(self, func),waitTime + extraWait);
// };


// editable.prototype.delayExecuteLater = function (func) {
//   var waitTime = 250, extraWait = 10, debug = false, self = this, now = (new Date).getTime();
//   var msSinceLastDelayCall = now - self.lastDelay;
//   if (debug) console.log('Delay\'s setTimeout executed ' + (now - self.lastDelay) + ' ms after the last time delay had been called.');
//   if ( msSinceLastDelayCall > waitTime) {
//     if (debug) console.log('Execute now');
//     func();
//     self.lastRedrawSet = false;
//     self.lastDelay = (new Date).getTime();
//     if (debug) console.log('Delay Execute took ' + (self.lastDelay - now) + ' ms');
//   } else {
//     if (debug) console.log('Wait another ' + (waitTime - msSinceLastDelayCall) + ' ms before executing.' );
//     setTimeout(self.delayExecuteLater.bind(self, func),waitTime + extraWait - msSinceLastDelayCall);
//   }
// };

editable.prototype.setSearchFieldsToSearchOnClear = function () {
    for (var field in this.sql_search_fields) {
        if (typeof(this.searchOnClear[field]) =="undefined") this.sql_search_fields[field] = "";
        else this.sql_search_fields[field] = this.searchOnClear[field];
        if (typeof(document.getElementById(this.headerId + "," + field))!="undefined") // had to do this b/c of gtd4_review setting 'id'
            $("#" + this.headerId + "," + field).val(this.sql_search_fields[field]);
    }
};


editable.prototype.updateX_js = function (id, input_field, input_values, this_node) {
    var id_split = this_node.parentNode.id.split(",");
        this.tbl_focus_row = id_split[1]; this.tbl_focus_col = id_split[2];
//### over complication for now...    if (this.tbl_updating_value === input_value) return; // nothing's changed
    var value = $(this_node).val();
    if (value === null) value="";
    else if (value.length != 1 && value[0]==="") {
        alert("This should not happen: " + value.join(","));
        value = value.slice(-value.length);
    }
    var url = this.sql_php+"?table="+this.tablename+"&cmd=updateX&id=" + id +
        "&field=" + input_field + "&value=" + encodeURIComponent(value.join(","));
    this.do_operation(url,false, "putRecord");
};

editable.prototype.on_focus = function (cell_id, value, node) {
    var id_split = cell_id.split(",");
    this.tbl_focus_row = id_split[1]; this.tbl_focus_col = id_split[2];
    this.tbl_updating_value = value;
    this.tbl_updating_node = node;
};

editable.prototype.on_keydown = function (e_alt_key, e_which) {
    //http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
    var r, c, id_split, element;
    if (e_which === 18) return; // e_alt_key = true;
    if (e_alt_key===true && (e_which==37 || e_which==38 || e_which==39 || e_which==40)) {
//    if (this.key_already_down) return true; else this.key_already_down = true;
        for (element = document.activeElement.parentNode; element !== null; element = element.parentNode) {
//        console.log(element.id + "=ID & tagName=" + element.tagName);
            if (element.tagName=="TD") {
                id_split = element.id.split(",");
                r = id_split[1]; c = id_split[2];
                switch (e_which) {
                case 88: // X for delete
                    var id = document.getElementById(this.tableId).rows[id_split[1]].cells[this.tbl_cols].childNodes[0].id;
                    if (typeof this.disableRemoveWhere == "undefined" || this.disableRemoveWhere(this.db.get(this.tablename, id)) === false) {
                        $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
                        deleteRecord(this.tableId, id);
                    }
                    return false;
                case 73: // I for insert
                    $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
                    postRecord(this.tableId);
                    return false;
                }
/*
                case 84: // T for timelog
                    $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
                    deleteRecord(this.tableId, document.getElementById(this.tableId).rows[id_split[1]].cells[this.tbl_cols].childNodes[0].id);
                    return false;
                case 86:// v86 // R82 for archive~~~~ conflict!!!!!!!
                    $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
                    deleteRecord(this.tableId, document.getElementById(this.tableId).rows[id_split[1]].cells[this.tbl_cols].childNodes[0].id);
                    return false;
*/
                // need loop to skip through elements that are hidden and won't set focus to
                var oldActiveElementId = document.activeElement.id;
//        while (oldActiveElementId === document.activeElement.id) {
                    switch (e_which) {
                    case 37: // ARROW LEFT
                        c = parseInt(c, 10) - 1;
                        if (c == -1) c = this.tbl_cols;
                        break;
                    case 38: // ARROW UP
                        r = parseInt(r, 10) - 1;
                        if (r === 0) r = this.tbl_rows;
                        break;
                    case 39: // ARROW RIGHT
                        c = parseInt(c, 10) + 1;
                        if (c == this.tbl_cols + 1) c = 0;
                        break;
                    case 40: // ARROW DOWN
                        r = parseInt(r, 10) + 1;
                        if (r == this.tbl_rows+1) r = 1;
                        break;
                    }
                    this.setFocus(r,c);
//        }

                return false; // means stopPropagation
            }
        }
        // default to first box
        r = 1; c = 0;
        this.setFocus(r,c);
// activeElement->blur.. this will happen anyways.. this triggers update and resets this.tbl_focus_row, this.tbl_focus_col    $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
/*  } else if (e_alt_key === true && e_which == 88) { //alt+ x (delete)
        if (this.key_already_down) return true; else this.key_already_down = true;
        for (element = document.activeElement.parentNode; element !== null; element = element.parentNode) {
            if (element.tagName == "TD") {
                id_split = element.id.split(",");
            }
        }
    } else if (e_alt_key === true && e_which==88) { //alt+ t (time log)
        if (this.key_already_down) return true; else this.key_already_down = true;
        for (element = document.activeElement.parentNode; element !== null; element = element.parentNode) {
            if (element.tagName=="TD") {
                id_split = element.id.split(",");
                $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
                deleteRecord(this.tableId, document.getElementById(this.tableId).rows[id_split[1]].cells[this.tbl_cols].childNodes[0].id);
            }
        }
    } else if (e_alt_key === true && e_which==88) { //alt+ x (delete)
        if (this.key_already_down) return true; else this.key_already_down = true;
        for (element = document.activeElement.parentNode; element !== null; element = element.parentNode) {
            if (element.tagName=="TD") {
                id_split = element.id.split(",");
                $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
                deleteRecord(this.tableId, document.getElementById(this.tableId).rows[id_split[1]].cells[this.tbl_cols].childNodes[0].id);
            }
        }
*/
    } else if (e_alt_key === true && e_which==8) { //alt+ backspace
        if (this.key_already_down) return true; else this.key_already_down = true;
        $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
        clear_searches();
    } else if (e_alt_key === true && e_which==75) { //alt+k
        if (this.key_already_down) return true; else this.key_already_down = true;
        $("#"+document.activeElement.id).trigger("blur"); // save various field update before clearing the searches
        this.clear_searches();
    } else return true; // uncaught keydown allows propagation
    return false; // this means I caught it and will stop propagation (this is implicit) e.stopImmediatePropagation();
};

editable.prototype.changeColorOfAllNodes = function(node, darker) {
    var self = this, color, newColor, $node = $(node);
    color = $node.css('background-color');
    newColor = this.changeColor(color, .2, darker);
    $node.css('background-color', newColor);
    $node.children().each(function () {
        self.changeColorOfAllNodes(this, darker);
    });
};


editable.prototype.setFocus = function(r,c, search) {
    // select first b/c of select2
    // if (typeof this.highlighted !== 'undefined') {
    //   this.changeColorOfAllNodes(document.getElementById(this.tableId).rows[this.highlighted.r].cells[this.highlighted.c], false);
    // }
    // this.changeColorOfAllNodes(document.getElementById(this.tableId).rows[r].cells[c], true);
    // this.highlighted = {r : r, c : c, originalBGColors : {}};
    //  $(document.getElementById(this.tableId).rows[r].cells[c]).css('background-color', 'yellow');

    var i, tags = ['select', 'input', 'textarea'], $e, $ei;
    // validation
    if (r >= document.getElementById(this.tableId).rows.length || c >= document.getElementById(this.tableId).rows[r].cells.length) {
        r = 1; c = 0;
    }
    // select2
    return; /// !!!!!!!!
    $e = $(document.getElementById(this.tableId).rows[r].cells[c]);
    if ($e[0].children.length !== 0 && typeof $e[0].children[0].classList !== 'undefined' && $e[0].children[0].classList.length !== 0 && $e[0].children[0].classList[0].slice(0,7) === 'select2') {
        $($e[0].children[0]).select2('open');
        $($e[0].children[0]).select2('close');
    } else {
        for (i = 0; i < tags.length; i += 1) {
            $ei = $e.find(tags[i]);
            if ($ei.length === 0) continue;
            $ei = $ei.first();
            if ($ei.length !== 0) {
                $ei.focus();
                if (typeof search === 'undefined') {
                    $ei.select();
                }
                return;
            }
        }
    } // for
};


editable.prototype.updateCWDTfromHidden = function (field_id) {
    if (document.getElementById(field_id).value === "" || document.getElementById(field_id).value.value=="0000-00-00 00:00:00") {
        document.getElementById(field_id+"d").value = "";
        document.getElementById(field_id+"t").value = "";
    } else {
        var dtjs = dateMYSQLtoJS(document.getElementById(field_id).value);
        document.getElementById(field_id+"d").value = ('00' + (dtjs.getMonth()+1)).slice(-2) + "/" + ('00' + dtjs.getDate()).slice(-2) + "/" + dtjs.getFullYear();
        document.getElementById(field_id+"t").value = ('00' + dtjs.getHours()).slice(-2) + ":" + ('00' + dtjs.getMinutes()).slice(-2);
    }
};


editable.prototype.convert_dt = function () {
    var dt_id = this.id.slice(0, -1);
    var $d = $("#" + dt_id + "d");
    var $t = $("#" + dt_id + "t");
    var d = $d.val();
    var t = $t.val();
    // conditions for entering and deleting out a date
    if (t === "" && d === "") {
        document.getElementById(dt_id).value = ""; // "0000-00-00 00:00:00"; this searches for only dates that have this instead of all dates
        document.getElementById(dt_id).onblur();
        return; // both empty, ### clear out
    } else if (this.id.slice(-1)=="t" && t === "" && d !== "") {
        $d.val("").focus(); // they just left time empty so assume they want to clear date
//    document.getElementById(dt_id).value = "0000-00-00 00:00:00";
//    document.getElementById(dt_id).onchange();
        return;
    } else if (this.id.slice(-1) == "d" && d === "" && t !== "") {
        $t.val("").focus();//.focus().select(); // they just left date empty so assume they want to clear time
//    document.getElementById(dt_id).value = "";
//    document.getElementById(dt_id).onchange();
        return;
    }
    // DATE
    var regexDate=/^([0-1]?[0-9])\/([0-3]?[0-9])\/([0-9]{2,4})$/;
    if (!regexDate.test(d)) {
        $d.focus().select(); // invalid, try again //alert($("#"+dt_id+"d").val()); //$("#"+dt_id+"d").val("MM/DD/YYYY");
        return;
    }
    var partsDate=d.replace(regexDate,"$1 $2 $3").split(' ');
    if (partsDate[2].length==2) { // 50 means 2050, 51 means 1951,
        if (parseInt(partsDate[2], 10) > 50) partsDate[2] = "19" + partsDate[2];
        else partsDate[2] = "20" + partsDate[2];
    }
    // TIME
    var regexTime=/^([0-2]?[0-9]):?([0-5][0-9])$/; // //    var regexTime=/^(?:([0-2][0-9]):([0-5][0-9]))$/;
    if (!regexTime.test(t)) {
        $t.focus().select(); // alert  ("TIME" +$("#"+dt_id+"t").val()); //$("#"+dt_id+"t").val("HH:MM");
        return;
    }
    var partsTime=t.replace(regexTime,"$1 $2").split(' ');
    var result = dateJStoMYSQL(new Date(partsDate[2],partsDate[0]-1,partsDate[1],partsTime[0],partsTime[1],0));
    if (document.getElementById(dt_id).value!=result) {
        document.getElementById(dt_id).value = result;
        document.getElementById(dt_id).onblur();
    }
};

editable.prototype.onkeyupSearch = function (event) {
    this.table_search_change(event.target.id.split(",")[1], $(event.target).val(),event.target);
};

editable.prototype.onPut = function (event) {
    // find out what the person has changed
    var id_ar = event.target.id.split(",");
    //  this.putRecord(id_ar[2], id_ar[1],$(event.target).val()); // was event.target.value
    var id = id_ar[2], input_field = id_ar[1], input_value = $(event.target).val();
    var record;

    var fieldOpt = this.schemas[this.tablename].fields[input_field];
    if (fieldOpt.multiple && input_value !== '') {
        // is last one a real record
        var ar = input_value.split(',');
        var search = this.db.get(fieldOpt.table, ar[ar.length - 1]);
        if (typeof search === 'undefined') {
            alert('The '+fieldOpt.table+' you added is not yet an option. Please go to that table and add it.');
            // doesn't work // ar.pop(); event.target.value = ar.join(',');
            // needs reference to s2 // $("#e8_2").select2("data", [{id: "CA", text: "California"},{id:"MA", text: "Massachusetts"}]);

            return;
        }
    }

    // has anything changed
    record = this.db.get(this.tablename, id);
    if (record[input_field] === input_value) { return; } // b/c nothing's changed

    // update client orm
    record[input_field] = input_value;
    this.pushTx(this.db.put(this.tablename, record));

    // update editable data table
    var recordNumber = this.idToRow[id]['data-record-number'];
    this.data.grid[recordNumber][input_field] = input_value;

};

editable.prototype.onFocus = function (event) {
    event = event || window.event;
    this.on_focus(event.target.parentNode.id, event.target.value, event.target);
};


editable.prototype.appendContentElementToCell = function (cell, field, i, data) {
// auto height makes it bounce when you type
    var self = this;
    element = document.createElement("textarea");
//        element.type = "text";
    element.rows = 1; // these sets what the auto width and height are
    element.cols = 40;
    element.style.width = "200px"; // was 120px
    element.style.whiteSpace = "nowrap";
    element.style.overflow = "auto";
//          element.style.overflowX = "scroll";
    if (i==this.recordSearchInsert) { //insert
        element.value = this.sql_search_fields[field];
        element.id = this.tableId + "," + field;
        // search
        //
/*          element.onkeyup = function (evt) {
//            this.style.height = 'auto';
//            this.style.height = Math.min(this.scrollHeight,400)+'px';
            self.table_search_change(this.id.split(",")[1], this.value,this);
        };*/
        element.onkeyup = self.onkeyupSearch;
        element.onblur = function (event) {
            if (!self.textarea_always_expanded) this.style.height = 'auto';
        };
        element.onfocus = function (event) {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight,400)+'px';
            self.on_focus(this.parentNode.id, this.value, this);
        };
    } else { // update
        element.value = data.grid[i][field];
        element.id = this.tableId + "," + field + "," + data.grid[i][this.primaryKey];
        element.onkeyup = function (event) {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 400)+'px';
        };
        element.onfocus = function (event) {
            this.select();
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 400)+'px'; // only works if it is already focused
            self.on_focus(this.parentNode.id, this.value, this);
        };
        element.onblur = function (event) {
            if (!self.textarea_always_expanded) this.style.height = 'auto';
            var id_ar = this.id.split(",");
            self.putRecord(id_ar[2], id_ar[1],this.value);
        };
    }
    if (this.textarea_always_expanded) {
        element.rows = (element.value.match(/\n/g)||[]).length+1;
    }
    cell.appendChild(element);

/*  $("#"+element.id).on("paste", function () {
        //// the oldest_value is a way to not get rid of the non-pasted newlines

        //put I could paste in the middle

        var element = this;
        var oldest_value = this.value;
        setTimeout(function () {
            var old_value = $(element).val();
            var new_value = "";
            var one_newline = false;
            // remove substrings until I get the oldest_value and those are the bounds of the pasted text

            var old_start = old_value.indexOf(oldest_value);
            var old_end = old_start + oldest_value.length;
            for (var i = 0; i< old_value.length;i++) {
                if (old_value.charCodeAt(i)==10 && (i<old_start || i>old_end)) {
                    if (one_newline) { new_value += old_value.charAt(i); one_newline= false; }
                    else one_newline = true;
                } else  new_value += old_value.charAt(i);
            }
            element.value = new_value;
        }, 100);
    }); // onpaste
*/

};



editable.prototype.appendFieldTo = function (o) {
    var element, $element, option,
    fieldOpt = o.fieldOpt, search = o.search, editable = o.editable, display = !o.search && !o.editable,
    none, inList, inTable, string, dsl, number, percent, datetime,
    multiple, minimumInputLength = o.nodropdown ? 100 : 0;

    none = fieldOpt.type === 'none' || fieldOpt.type === '' || fieldOpt.type === 'id',
    inList = fieldOpt.type == "inList",
    inTable = fieldOpt.type == "inTable",
    string = fieldOpt.type == "string",
    dsl = fieldOpt.type == "dsl",
    number = fieldOpt.type == "number",
    percent = fieldOpt.type.indexOf("percent") !== -1,
    datetime = fieldOpt.type == "datetime";

    $(o.baseElem).empty();

    var tableField, inListArray,len, recordValue, j, s2, dt;

    // NONE
    if (none) {
        element = document.createElement("input");
        o.baseElem.style.padding = "0px";
        element.style.display = "none";
        element.value = o.value;
        o.baseElem.appendChild(element);

// INLIST, BELONGSTO, HASONE, HASMANY
    } else if (inList || inTable) {

        element = document.createElement(display ? 'div' : (fieldOpt.multiple ? 'input' : 'select'));
        if (typeof o.id !== 'undefined') { element.id = o.id; }

        if (fieldOpt.multiple) { element.type = 'hidden'; } // WHY

        if (!o.unstyled) {
            element.style.maxWidth = element.style.width = fieldOpt.multiple ? "150px" : "100px";
        }

        if (inTable) {
            tableField = typeof fieldOpt.tableField !== 'undefined' ? fieldOpt.tableField : 'name';
            dt = o.data[ fieldOpt.table ];
        } else if (inList) {
            inListArray = fieldOpt.inList;
        }

        // depends on: element (modifies), display, search, editable, fieldOpt
        if (display) {
            element.style.textOverflow = 'ellipsis';
            element.style.whiteSpace = 'nowrap';
            element.style.overflow = 'hidden';
            element.title = element.innerHTML;
        } else if (search) { // the null option
            element.value = "";
            element.required = false;
            if (!fieldOpt.multiple) {
                option = document.createElement("option");
                option.value = "";
                option.innerHTML = "";
                option.selected = "selected";
                element.appendChild(option);
            }
        } else if (editable) {
            if (fieldOpt.nullable) {
                if (!fieldOpt.multiple) {
                    option = document.createElement("option");
                    option.value = "";
                    option.innerHTML = "";
                    element.appendChild(option);
                }
                element.required = false;
            } else {
                element.required = true;
            }
        }

        if (display || fieldOpt.multiple /* && editable*/) {
            var rec;
            if (typeof o.value !== 'undefined' && o.value !== null) {
                if (inList) {
                    if (!display && fieldOpt.multiple) {
                        element.value = o.value;
                    } else {
                        element.innerHTML = o.value;
                    }
                } else if (inTable) {
                    if (!fieldOpt.multiple) {
                        rec = o.db.getRef(fieldOpt.table, o.value);
                        element.innerHTML = (typeof rec !== 'undefined') ? rec[tableField] : '';
                    } else if (fieldOpt.multiple) {
                        if (!display) {
                            element.value = o.value;
                        } else {
                            var i, ar;
                            ar = (typeof o.value === 'object' && o.value !== null) /* already an array */  ? o.value : (o.value==='' ? [] : o.value.split(','));
                            element.innerHTML = '';
                            for (i = 0; i < ar.length; i += 1) {
                                var record = o.db.getRef(fieldOpt.table, ar[i]);
                                if (typeof record !== 'undefined') {
                                    element.innerHTML += ((element.innerHTML !== '') ? ', ' : '') + record[tableField];
                                }
                            }
                        } // display or not
                    } // fieldOpt.multiple or not
                } // inList or inTable
            } // if there was a value
        } else { // !display && !(fieldOpt.multiple && editable) ==== all search, all single editable
            len = inList ? inListArray.length : dt.length;
            recordValue = o.value;
            for (j = 0; j < len; j++) {
                option = document.createElement("option");
                option.value = inList ? inListArray[j] : dt[j][ o.primaryKey ]; // [table][recnum][id]
                option.innerHTML = inList ? inListArray[j] : dt[j][tableField];
                if (option.value === recordValue ||
                        fieldOpt.multiple && editable && typeof recordValue === 'string' && // !== null and undefined
                        recordValue.indexOf(option.value) !== -1) {
                    option.selected = "selected";
                }
                element.appendChild(option);
            }
        }
        // ELEMENT is ready, add it to the DOM
        o.baseElem.appendChild(element);
        $element = $(element);

        // select2 enhancements
        if (!display) {
            if (fieldOpt.multiple) {
                var tags = [];
                if (inList) {
                    len = inListArray.length;
                    for (j = 0; j < len; j++) {  tags.push({text: inListArray[j], id: inListArray[j]});  }
                } else {
                    len = dt.length
                    for (j = 0; j < len; j++) {  tags.push({text: dt[j][tableField], id: dt[j][ o.primaryKey ]});  }
                }
                s2 = $(element).select2({
                    minimumInputLength : minimumInputLength,
                    tags : tags,
                    onsearch : o.onsearch,
                    createSearchChoicePosition : function (list, item) {
                        if (list.length === 0) { // if no other option then optionally offer to add it with changes
                            // item.text += ' (add)';
                            // list.push(item);
                        }
                    }
                    // createSearchChoice : function (term) {}
                });
                s2.select2("container").find("ul.select2-choices").sortable({
                    minimumInputLength : minimumInputLength,
                    containment: 'parent',
                    start: function() { s2.select2("onSortStart"); },
                    update: function() { s2.select2("onSortEnd"); }
                });
            } else {  // SINGLE
                s2 = $element.select2({
                    onsearch : o.onsearch,
                    minimumInputLength : minimumInputLength,
                    allowClear : true
                });
            }
            s2.on('change', o.onchange);
            s2.on('keydown', o.matcher);
            s2.on("select2-focus", self.onFocus);
            s2.focus = function() { $(element).select2("focus"); };
            $element = s2;
        }

// STRING, DSL, DATETIME, NUMBER, PERCENT
    } else if (string || dsl || datetime || number || percent) {
        element = document.createElement(display ? 'div' : 'input');
        if (typeof o.id !== 'undefined') { element.id = o.id; } // id must be assigned prior to making the datepicker

        if (typeof fieldOpt.len !== 'undefined') { element.maxlength = fieldOpt.len; }
        element[display ? 'innerHTML' : 'value'] = util.isBlank(o.value) ? '' : (
            datetime ? util.dateObjToMMddYYYY(o.value) : o.value);

        // by display, search, editable
        if (display) {
            element.style.textOverflow = 'ellipsis';
            element.style.whiteSpace = 'nowrap';
            element.style.overflow = 'hidden';
            element.title = element.innerHTML;
        } else {
            element.type = "text";
            // element.onfocus = self.onFocus;
            element.style.borderRadius = '4px'; // ~~~~~~~
            if (search) {
                element.onkeyup = o.onchange;
            } else if (editable) {
                element.onblur = o.onchange;
            }
        }

        // by type
        if (number || percent) {
            element.style.textAlign = 'right';
            element.style.width = '90px';
            if (number && !search) {
                element[display ? 'innerHTML' : 'value'] = (Number(element[display ? 'innerHTML' : 'value']));
            }
            if (percent && !search) {
                element[display ? 'innerHTML' : 'value'] = (Number(element[display ? 'innerHTML' : 'value']) * 100).toFixed(0);
            }
        } else if (datetime) {
            var w = 125 + 30;
            o.baseElem.style.minWidth = w + 'px';
            o.baseElem.style.maxWidth = w + 'px';
            o.baseElem.style.width = w + 'px';
            element.style.width = display ? (w -5) + 'px' : (w-35) + 'px';
        } else if (string || dsl) {
            element.style.width = ((typeof fieldOpt.len === 'undefined') ? 10 : fieldOpt.len) * 12 + 50 + 'px';
        }
        element.style.maxWidth = element.style.minWidth = element.style.width;

        o.baseElem.appendChild(element);
        $element = $(element);
        if (datetime && !display) { // must occur after o.baseElem.appendChild(element);
            $('div.ui-datepicker').css({fontSize : '10px'});
            var dtp = $element.datetimepicker({
                showOn: "button",
                buttonImage: "images/calendar.gif",
                buttonImageOnly: true
            });
            dtp.on('change', o.onchange);
            $element = dtp;
        }
    } else {
        throw "Attention Programmer: Field does has the fieldOpt.type '" + fieldOpt.type + "' which is not recognized by editable!";
    } // which type of field
    return $element;
};

editable.prototype.appendFieldToCell = function (cell, field, recordNumber, data, editable) {
    var o, search, fieldOpt = this.schemas[this.tablename].fields[field];
    fieldOpt.multiple = typeof fieldOpt.multiple === 'undefined' ? false : fieldOpt.multiple;
    search = recordNumber === this.recordSearchInsert;
    o = {
        baseElem : cell,
        db : this.db,
        primaryKey : fieldOpt.table ? this.schemas[fieldOpt.table].primaryKey : undefined,
        fieldOpt : fieldOpt,
        editable : editable || false,
        search : search,
        data : data
    };
    o.onfocus = this.onFocus;
    o.id = (search ? this.headerId : this.tableId) + ',' + field + (search ? '' : (',' + data.grid[recordNumber][this.primaryKey]));
    if (search) {
        o.onchange = this.onkeyupSearch.bind(this);
        o.value = this.sql_search_fields[field];
    } else {
        o.value = (typeof data.grid[recordNumber][field] === 'undefined' ? '' : data.grid[recordNumber][field]);
        o.onchange = this.onPut.bind(this);
    }
    return this.appendFieldTo(o);
};





editable.prototype.tools = function (event) {
    var self = this;
    if (this.crudHidden) {
        $(this.containerElem).find('.crud').each(function () {
            $(this).css('display', 'inline');
            $(this).parent().css('minWidth', '');
        });
        this.crudHidden = false;
    } else {
        $(this.containerElem).find('.crud').each(function () {
            $(this).css('display', 'none');
            $(this).parent().css('minWidth', '');
        });
        this.crudHidden = true;
    }
    self.equalizeActionColumnWidth();
    // var a = this.tableElem.rows.length + ' out of ' + this.data.grid.length + ' matched records are displayed.';
    // alert(a);
};

editable.prototype.callAction = function(event) {
    var ar = event.target.id.split(',');
    this.actions[ar[3]].action(ar[2]);
};


editable.prototype.appendActionsCell =  function (cell, recordNumber, data) {
    // order //...

    var element, self = this;

    cell.style.whiteSpace = "nowrap";

    if (recordNumber==this.recordHeader) { // Header
        cell.style.verticalAlign = "middle";
        //cell.innerHTML = "<b>Action</b>";

        if (typeof this.backCallback === "function") {
            // back button
            element = document.createElement("input");
            element.type = "button";
            element.value = "Back";
            element.onclick = function (event) {
                self.backCallback(self.tablename);
            };
            element.onfocus = self.onFocus;
            cell.appendChild(element); //button
        }


        if (typeof this.toolsButtonHTML !== 'undefined') {
            element = $.parseHTML(this.toolsButtonHTML)[0];
        } else {
            element = document.createElement("input");
            element.type = "button";
            element.value = "Tools";
        }
        element.onmouseup = this.tools.bind(this);
        element.id = this.headerId + "," + "tools_button";
        cell.appendChild(element);
        this.toolsButton = element;



    } else if (recordNumber==this.recordSearchInsert) { // INSERT/ADD BUTTON
        if (!this.singleSelect) {
            this.renderSelectButtons(cell, 'recordSearchInsert', this.selectAll.bind(this));
        }
        if (typeof this.disableAdd == "undefined" || this.disableAdd === false) {
            if (typeof this.addButtonHTML !== 'undefined') {
                element = $.parseHTML(this.addButtonHTML)[0];
            } else {
                element = document.createElement("input");
                element.type = "button";
                element.value = "+" // add
            }
            element.onclick = self.postRecord.bind(self);

            element.className += ' crud';
            if (this.crudHidden) { element.style.display = 'none'; }
            element.onfocus = self.onFocus;
            cell.appendChild(element); //button
        }

        // undo/redo
        if (this.undoType === 'word' || this.undoType === 'vim' || this.undoType === 'emacs') {
            if (typeof this.undoButtonHTML !== 'undefined') {
                element = $.parseHTML(this.undoButtonHTML)[0];
            } else {
                element = document.createElement("input");
                element.type = "button";
                element.value = "Undo";
            }
            element.onmouseup = this.undo.bind(this);
            element.id = this.headerId + "," + "undo_button";
            element.style.opacity = '0.5';
            element.className += ' crud';
            if (this.crudHidden) { element.style.display = 'none'; }
            cell.appendChild(element);
            this.undoButton = element;
        }

        if (this.undoType === 'word' || this.undoType === 'vim') {
            if (typeof this.redoButtonHTML !== 'undefined') {
                element = $.parseHTML(this.redoButtonHTML)[0];
            } else {
                element = document.createElement("input");
                element.type = "button";
                element.value = "Redo";
            }
            element.onmouseup = this.redo.bind(this);
            element.id = this.headerId + "," + "redo_button";
            element.style.opacity = '0.5';
            if (this.crudHidden) { element.style.display = 'none'; }
            element.className += ' crud';
            cell.appendChild(element);
            this.redoButton = element;
        }

    } else { // DELETE & SELECT
        var id = data.grid[recordNumber][this.primaryKey];
        this.idToActionsCell[ id ] = cell;

        if (typeof this.actions !== 'undefined') {
            for (var i = 0; i < this.actions.length; i += 1) {
                element = $.parseHTML(this.actions[i].buttonHTML)[0];
                element.onmouseup = this.callAction.bind(this);
                element.onfocus = self.onFocus;
                element.id = this.tableId + "," + "action_button," + data.grid[recordNumber][this.primaryKey] + ',' + i;
                cell.appendChild(element);

            }
        }


        this.renderSelectButtons(cell, id, this.selectRow.bind(this));



        if (!this.disableEdit && this.rowClick !== 'edit') {
            if (typeof this.editButtonHTML !== 'undefined') {
                element = $.parseHTML(this.editButtonHTML)[0];
            } else {
                element = document.createElement("input");
                element.type = "button";
                element.value = "Edit"
            }
            element.onmouseup = this.editRow.bind(this);
            element.onfocus = self.onFocus;
            element.id = this.tableId + "," + "edit_button" + "," + data.grid[recordNumber][this.primaryKey];
            if (this.crudHidden) { element.style.display = 'none'; }
            element.className += ' crud';
            cell.appendChild(element);
        }


        if (typeof this.disableRemoveWhere == "undefined" || this.disableRemoveWhere(data.grid[recordNumber]) === false) {
            if (typeof this.removeButtonHTML !== 'undefined') {
                element = $.parseHTML(this.removeButtonHTML)[0];
            } else {
                element = document.createElement("input");
                element.type = "button";
                element.value = "X"
            }
            element.title = 'Delete this action forever.';
            element.onclick = function (event) { self.deleteRecord(this.id.split(",")[2]); };
            element.onfocus = self.onFocus;
            element.id = this.tableId + "," + "delete_button" + "," + data.grid[recordNumber][this.primaryKey];
            if (this.crudHidden) { element.style.display = 'none'; }
            element.className += ' crud';
            cell.appendChild(element); //button

        }
/*
        if (this.tablename=="actions") {
            element = document.createElement("input");
            element.type = "button";
            element.id = this.tableId + "," + "timelog_button" + "," + data.grid[recordNumber][this.primaryKey];
            element.value = "T";
            element.title = "Time Log this action.";
            element.onclick = function () {};
            element.onfocus = self.onFocus;
            cell.appendChild(element); //button
            element = document.createElement("input");
            element.type = "button";
            element.id = this.tableId + "," + "archive_button" + "," + data.grid[recordNumber][this.primaryKey];
            element.value = "R";
            element.title = "Archive this action.";
            element.onclick = function () {};
            element.onfocus = self.onFocus;
            cell.appendChild(element); //button
        }
*/
    }
};


editable.prototype.renderSelectButtons = function (cell, id, func) {
    var element;
    if (typeof this.selectedButtonHTML !== 'undefined') {
        element = $.parseHTML(this.selectedButtonHTML)[0];
    } else {
        element = document.createElement("input");
        element.type = "button";
        element.value = "√";
    }
    element['data-id'] = id;
    element.onclick = func;
    element.onfocus = this.onFocus;
    element.style.display = 'none';
    element.id = this.tableId + "," + "selected_button" + "," + id;
    cell.appendChild(element); //button

    // unselected button
    if (typeof this.unselectedButtonHTML !== 'undefined') {
        element = $.parseHTML(this.unselectedButtonHTML)[0];
    } else {
        element = document.createElement("input");
        element.type = "button";
        element.value = "□";
    }
    element['data-id'] = id;
    element.onclick = func;
    element.onfocus = this.onFocus;
    element.style.display = (this.check ? 'inline' : 'none');
    element.id = this.tableId + "," + "unmarked_button" + "," + id;
    cell.appendChild(element);
};

editable.prototype.setDisplay = function (recordNumber, cell, display) {
    var e;
    if (typeof display !== "undefined") {
        display = display.toLowerCase();
        if (display === "none") {
            cell.style.padding = "0px";
            if (recordNumber == this.recordHeader) { // there were no elements so it was probably the header
                cell.innerHTML = "";
            } else {
                for (e = 0; e < cell.childNodes.length; e++) { // for each element in cell
                    cell.childNodes[e].style.display = "none";
                }
            }
        } else if ((recordNumber === this.recordSearchInsert && display === "disablesearch") ||
                display === "disablesearchandedit" ||
                (recordNumber !== this.recordSearchInsert && display === "disableedit")) {
            for (e = 0; e < cell.childNodes.length; e++) { // for each element in cell
                cell.childNodes[e].disabled = true;
            }
        }
    }
};

editable.prototype.reverseSort = function () {
    var oldSort, i, self = this, newRecordOrder = [];
    for (i in self.schemas[self.tablename].recordOrder) {
        if (self.schemas[self.tablename].recordOrder[i].attribute ===
                window.event.target["data-field-name-for-sort"]) {
            // move to the beginning so it gets presidence
            // oldSort = {
            //   attribute : self.schemas[self.tablename].recordOrder[i].attribute,
            //   descending : !self.schemas[self.tablename].recordOrder[i].descending
            // };
            self.schemas[self.tablename].recordOrder[i].descending = !self.schemas[self.tablename].recordOrder[i].descending;
            newRecordOrder = self.schemas[self.tablename].recordOrder.splice(i, 1);
            for (var z = 0; z <= self.schemas[self.tablename].recordOrder.length; z += 1) { // notice <= b/c it's shorter than it usually is since I spliced 'i' out
                if (typeof self.schemas[self.tablename].recordOrder[z] !== 'undefined') { // skips the one i removed
                    newRecordOrder.push(self.schemas[self.tablename].recordOrder[z]);
                }
            }
            //before maintaining order - self.schemas[self.tablename].recordOrder.unshift(oldSort);
            // reorder array
            self.schemas[self.tablename].recordOrder = newRecordOrder;
            self.query();
            break;
        }
    }
    if (newRecordOrder.length === 0) { // since I got here it must of not had a sort record so I'll add one
        self.schemas[self.tablename].recordOrder.unshift({attribute : window.event.target["data-field-name-for-sort"], descending : false});
        self.query();
    }
    // repaint header cells
    var row = window.event.target.parentNode;
    for (i = 0; i < row.cells.length; i += 1) {
        if (typeof row.cells[i]['data-field-name-for-sort'] !== 'undefined') {
            this.paintHeaderCell(row.cells[i], row.cells[i]['data-field-name-for-sort']);
        }
    }
};


editable.prototype.paintHeaderCell = function (cell, field) {
    if (["", "none", "id"].indexOf(this.schemas[this.tablename].fields[field].type) === -1) {
        cell.style.verticalAlign = "middle";
        cell.innerHTML = this.schemas[this.tablename].fields[field].header;
        for (var z = 0; z < this.schemas[this.tablename].recordOrder.length; z += 1) {
            if (this.schemas[this.tablename].recordOrder[z].attribute === field) {
                if (this.schemas[this.tablename].recordOrder[z].descending) {
                    cell.innerHTML += ' (' + (z + 1) + '▾)';
                } else {
                    cell.innerHTML += ' (' + (z + 1) + '▴)';
                }
                break;
            }
        }
        cell.style.fontWeight = "bold";
        cell["data-field-name-for-sort"] = field;
        cell.onclick = this.reverseSort.bind(this);
    }
};

editable.prototype.highlightRow = function(row, highlight) {
    var i;
    if (this.check) { // default
        var actionsCell = this.idToActionsCell[ row['data-id'] ];
        if (highlight) {
            // cycle thru elements on actions cell looking for old select button and get rid of it
            for (i = 0; i < actionsCell.children.length; i += 1) {
                if (actionsCell.children[i].id.indexOf('selected_button') !== -1) {
                    actionsCell.children[i].style.display = 'inline';
                } else if (actionsCell.children[i].id.indexOf('unmarked_button') !== -1) {
                    actionsCell.children[i].style.display = 'none';
                }
            }
        } else {
            // cycle thru elements on actions cell looking for old select button and get rid of it
            for (i = 0; i < actionsCell.children.length; i += 1) {
                if (actionsCell.children[i].id.indexOf('selected_button') !== -1) {
                    actionsCell.children[i].style.display = 'none';
                } else if (actionsCell.children[i].id.indexOf('unmarked_button') !== -1) {
                    actionsCell.children[i].style.display = 'inline';
                }
            }
        }
    }
    if (this.highlight) {
        for (i = 0; i < row.children.length; i += 1) {
            if (highlight) {
                row.children[i].className = 'highlightedrow ' + row.className;
            } else {
                row.children[i].className = row.children[i].className.replace('highlightedrow', '');
            }
        }
    }
};

editable.prototype.selectAll = function(event) {
    var lastSelectState = this.selectState;
    // first invert selection, then select all then none, then
    if (lastSelectState === 'inverted') {
        // now select all
        //go thru rows on table and add all to
        this.idsHighlighted = [];
    }
    // invert selection
    var r;
    for (r = 0; r < this.tableElem.rows.length; r += 1) {
        //if (this.idsHighlighted.indexOf(this.tableElem.rows[r]['data-id']) === -1) {
        if (this.tableElem.rows[r].cells.length > 1) {
            this.selectRow({currentTarget : this.tableElem.rows[r]}); // inverts row
        }
        //}
    }
    switch (lastSelectState) {
    case 'single': this.selectState = 'inverted'; break;
    case 'inverted': this.selectState = 'all'; break;
    case 'all': this.selectState = 'none'; break;
    case 'none': this.selectState = 'all'; break;
    }
};

editable.prototype.selectRow = function(event) {
    var index, id, row;
    row = event.currentTarget;
    while (row.tagName !== 'TR') {
        row = row.parentNode;
    }
    id = row['data-id'];
    if (typeof event.preventDefault === 'function') {
        event.preventDefault();
        event.stopPropagation();
    }
    if (this.singleSelect) {
        if (typeof this.lastRowHighlighted !== 'undefined' && this.lastRowHighlighted !== null) {
            this.highlightRow(this.lastRowHighlighted, false);
            if (this.lastRowHighlighted === row) {
                this.idsHighlighted = [];
                delete this.lastRowHighlighted;
                return;
            }
        }
        this.highlightRow(row, true);
        this.lastRowHighlighted = row;
        this.idsHighlighted = [id];
        if (typeof this.onselect === 'function') {
            this.onselect(this.tablename, util.clone(this.idsHighlighted));
        }
    } else {
        index = this.idsHighlighted.indexOf(id);
        if (index === -1) { // it's not been highlighted yet
            this.highlightRow(row,true);
            this.idsHighlighted.push(id);
            this.lastRowHighlighted = row;
        } else {// it's already highlighted
            this.highlightRow(row, false);
            this.idsHighlighted.splice(index,1);
        }
        if (typeof this.onselect === 'function') {
            this.onselect(this.tablename, util.clone(this.idsHighlighted));
        }
    }
    this.selectState = 'single';
};


editable.prototype.editRow = function (event, fieldToFocus) {
    var row;
    row = event.currentTarget;
    while (row.tagName !== 'TR') {
        row = row.parentNode;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!this.disableEdit && typeof row['data-record-number'] !== 'undefined') {
        if (typeof this.lastRowHighlighted !== 'undefined' && this.lastRowHighlighted !== null) {
            this.makeRowEditable(this.lastRowHighlighted, false);
            if (this.lastRowHighlighted === row) {
                this.lastRowHighlighted = null;
                return;
            }
        }
        this.makeRowEditable(row, true, fieldToFocus);
        this.lastRowHighlighted = row;
    }
};


editable.prototype.getFieldNameFromDisplayDiv = function(element) {
    return element.id.split(',')[1];
};

editable.prototype.on_row_click = function (event) {
    var et = event.target;
    // only respond if they don't click on a control
    if (et.tagName === 'TD' || et.tagName === 'TR'  || (et.tagName === 'DIV' && et.parentNode.tagName === 'TD')) {
        // console.log(et.tagName);
        // console.log(et.parentNode.tagName);
        //if (typeof id === 'undefined') return;
        var fieldName;
        if (this.rowClick === 'select') {
            this.selectRow(event);
        } else if (this.rowClick === 'edit') {
            if (et.tagName === 'TD') {
                fieldName = this.getFieldNameFromDisplayDiv(et.firstChild);
            } else if (et.tagName === 'DIV' && et.parentNode.tagName === 'TD') {
                fieldName = this.getFieldNameFromDisplayDiv(et);
            }
            this.editRow(event, fieldName);
        }
    }
};

editable.prototype.makeRowEditable = function(row, editable, fieldToFocus) {
    var i, field, f;
    for (i = 0; i < row.children.length; i += 1) {
        if (this.actionsLayout === 'first' && i === 0) {
        } else if (this.actionsLayout === 'last' && i === row.children.length - 1) {
        } else {
            for (f in this.schemas[this.tablename].fieldOrder) {
                field = this.schemas[this.tablename].fieldOrder[f];
                if (editable && field === fieldToFocus) {
                    this.appendFieldToCell(row.children[i], field, row['data-record-number'], this.data, editable).focus();
                } else {
                    this.appendFieldToCell(row.children[i], field, row['data-record-number'], this.data, editable);
                }
                i += 1;
            } // for field
        }
    } // for cell
};

editable.prototype.redrawGrid = function (data, redraw_search) {
    util.time('editable.redrawGrid');
    // clone speeds up by 13% but I got rid of it
    // chosen slows down load by 700%
    // datetime picker slows down by not much

    var self = this, recordNumber, table, rowCount, row, cell, f, field, fieldOpt, element;
    table = document.getElementById(this.tableId);

    this.recordLimitElem.innerHTML = '';

    // recordNumber used to be row but now it is the recordNumber
    // tbl_cols and tbl_rows will be switched
    // do everything in terms of cells
    // switch from talking about cols and rows to talking about fields and records then just switch the bindings

    // define iterators over records and fields independently of rows and columns
    function createNextFieldsCell(dataGridRecordNumber) {
        var cell, table;
        if (dataGridRecordNumber === self.recordHeader || dataGridRecordNumber === self.recordSearchInsert) {
            table = self.headerElem;
        } else {
            table = self.tableElem;
        }
        var recordNumber = dataGridRecordNumber - self.recordHeader;
        if (typeof self.pivot !== "undefined" && self.pivot == true) {
            // maybe move this into create record?? no b/c I have to set the row each time I iterate to new field
            self.tbl_cols = recordNumber;
            if (self.tbl_rows >= table.rows.length) { // row not there so create it
                debugger;
                alert("when is this code ever executed");
                row = table.insertRow(self.tbl_rows);

            } else {
                row = table.rows[self.tbl_rows];
            }

            cell = row.insertCell(self.tbl_cols);
            cell.id = table.id+","+ self.tbl_rows + "," + self.tbl_cols;
            self.tbl_rows++;
        } else {
            cell = row.insertCell(self.tbl_cols);
            cell.id = table.id+","+ recordNumber + "," + self.tbl_cols;
            self.tbl_cols++;
        }
        // highlight rows after a sort
        if (typeof self.idsHighlighted !== 'undefined') {
            for (var i = 0; i < self.idsHighlighted.length; i += 1) {
                if (self.idsHighlighted[i] === data.grid[dataGridRecordNumber][self.primaryKey]) {
                    self.highlightRow(row, true);
                    //cell.className = 'highlightedrow ' + cell.className;
                    break;
                }
            }
        }
        return cell;
    }
    this.fieldIterator = 0;
    function getFirstFieldsCell(recordNumber) {
        recordNumber -= self.recordHeader;
        self.fieldIterator = 0;
        if (typeof self.pivot !== "undefined" && self.pivot == true) {
            return table.rows[0].cells[recordNumber];
        } else {
            return table.rows[recordNumber].cells[0];
        }
    }
    function getNextFieldsCell(recordNumber) {
        recordNumber -= self.recordHeader;
        self.fieldIterator++;
        if (typeof self.pivot !== "undefined" && self.pivot == true) {
            if (table.rows.length <= self.fieldIterator) return table.rows[self.fieldIterator];
            return table.rows[self.fieldIterator].cells[recordNumber];
        } else {
            return table.rows[recordNumber].cells[self.fieldIterator];
        }
    }
    function createNextRecord(recordNumber) {
        var table, dataGridRecordNumber;
        if (recordNumber === self.recordHeader || recordNumber === self.recordSearchInsert) {
            table = self.headerElem;
        } else {
            table = self.tableElem;
        }
        dataGridRecordNumber = recordNumber - self.recordHeader;
        if (typeof self.pivot !== "undefined" && self.pivot == true) {
            self.tbl_rows = 0;
            self.tbl_cols++; // actually create the column in createNextFieldsCell, I can't do it here b/c
        } else {
            row = table.insertRow(table.rows.length);
            if (recordNumber >= 0) {
                row['data-id'] = data.grid[recordNumber][self.primaryKey];
                self.idToRow[data.grid[recordNumber][self.primaryKey]] = row;
                row['data-record-number'] = recordNumber;
                row.onmouseup = self.on_row_click.bind(self);
            } else if (recordNumber === self.recordHeader) {
                self.headerRow = row;
            } else if (recordNumber === self.recordSearchInsert) {
                self.searchRow = row;
            }
            self.tbl_cols = 0;
            self.tbl_rows = table.rows.length-1; // b/c I don't want to include max record row
        }
    }
    function deleteRecord(recordNumber) {
        if (typeof self.pivot !== "undefined" && self.pivot == true) {
            recordNumber -= self.recordHeader;// definitely not in the non pivot case now with a seperate table
            if (table.rows.length == 0) return false;
            for (var r = 0; r < table.rows.length; r++) {
                if (recordNumber >= table.rows[r].cells.length) return false;
                table.rows[r].deleteCell(recordNumber);
            }
        } else {
            if (recordNumber >= table.rows.length) {
                return false;
            }
            table.deleteRow(recordNumber);
        }
        return true;
    }



    // DELETE all old data including search if desired
    redraw_search = typeof(redraw_search) !== 'undefined' ? redraw_search : false;
    // skip search/add bar?
    if ((typeof this.disableSearch == "boolean" && this.disableSearch == true) ||
            (typeof this.disableSearchAndEdit == "boolean" && this.disableSearchAndEdit == true)) {
        this.recordSearchInsert = -20; // unreachable
        this.recordHeader = -1;
    }
    if (redraw_search) recordNumber = this.recordHeader;
    else recordNumber = 0; // Don't delete or redrawing the header and insert/search
    for(;deleteRecord(0);) {}

    // Populate data table
    for (;recordNumber < data.grid.length;recordNumber++) { //var dataRow in data.grid) {
        // max_records AND recordLimit??
        if (recordNumber>=data.max_records) {
            this.recordLimitElem.innerHTML = "<em>Your selection resulted in greater than <strong>" + data.max_records + "</strong> records. Please narrow your criteria to see the rest of the results.</em>";
            break;
        } else if (recordNumber>=this.recordLimit) {
            var doubleId = this.tableId + ',getDouble';
            var tenTimesId = this.tableId + ',getTenTimes';
            this.recordLimitElem.innerHTML = "More records... Please narrow your search or See <a id='"+doubleId+"'>"+this.recordLimit+"</a> or <a id='"+tenTimesId+"'>"+(10*this.recordLimit)+"</a> more.";
            document.getElementById(doubleId).onclick = function(event) {
                event.preventDefault();
                self.recordLimit *= 2;
                self.query();
            };
            document.getElementById(tenTimesId).onclick = function(event) {
                event.preventDefault();
                self.recordLimit *= 10;
                self.query();
            };
            break;
        }

        createNextRecord(recordNumber);

        // ACTIONS BUTTONS
        if (this.actionsLayout == "first") {
            this.appendActionsCell(createNextFieldsCell(recordNumber), recordNumber, data);
        }

        //INSERT FIELDS
        for (var f in this.schemas[this.tablename].fieldOrder) {
            field = this.schemas[this.tablename].fieldOrder[f];
            cell = createNextFieldsCell(recordNumber);
            if (recordNumber===this.recordHeader) {
                this.paintHeaderCell(cell, field);
            } else {
                if (recordNumber===this.recordSearchInsert) {
                    this.insertControls[field] = this.appendFieldToCell(cell, field, recordNumber, data);
                } else {
                    this.appendFieldToCell(cell, field, recordNumber, data);
                }
            }
            this.setDisplay(recordNumber, cell, this.schemas[this.tablename].fields[field].display);
        } // for each field/column

        // ACTIONS BUTTONS
        if (this.actionsLayout == "last") {
            this.appendActionsCell(createNextFieldsCell(recordNumber), recordNumber, data);
        }

        // disable records by disableWhere
        if (recordNumber >= 0 && this.disableWhere(data.grid[recordNumber])) {
            for (cell = getFirstFieldsCell(recordNumber); typeof cell !== "undefined"; cell = getNextFieldsCell(recordNumber)) { // iterate over cells
                for (var e = 0; e < cell.childNodes.length; e++) { // for each element in cell
                    if (cell.childNodes[e].id.indexOf("select_button") == -1) {
                        cell.childNodes[e].disabled = true;
                    }
                }
            }
        } // disable records by disableWhere


    } // for dataRow in data.grid



    // initialize all jQuery UI widgets BY CLASS
    if (this.use_chosen) {
        jQuery(".chzn-select-deselect").data("placeholder","Select one...").chosen({allow_single_deselect:true});
        jQuery(".chzn-select").data("placeholder","Select one...").chosen({no_results_text: "No results matched"});
        $('.chzn-single').focus(function(e){
            self.on_focus(this.parentNode.id, this.value, this);
            e.preventDefault();
        });
    }
    if (this.use_datepicker) {
        $(".cwdt-date").datepicker({//    showOn: "button",
            onSelect: function(date) {
                $(this).val(this.value);
                self.convert_dt.call(this);
            }
        });
    }

    // #############
    this.tbl_cols--; // because the count is one more than the last element if you count from 0
    // ###################


    //set focus
    if (this.tbl_focus_row>this.tbl_rows) this.tbl_focus_row = this.tbl_rows;
    if (this.tbl_focus_row == 1) { //caller == "table_search_change") {
        // don't select
        this.setFocus(this.tbl_focus_row, this.tbl_focus_col, 'search');
    } else {
        this.setFocus(this.tbl_focus_row, this.tbl_focus_col);
    }

    // correct header cell widths for unknown width in actions cell
    setTimeout(this.equalizeActionColumnWidth.bind(this));

    this.selectState = 'unselected';

    util.timeEnd('editable.redrawGrid');
}; // function redrawGrid



editable.prototype.equalizeActionColumnWidth = function () {
    var self = this, r, rowsLen = self.tableElem.rows.length, c, colWidth, colMax = [];
    // header row
    for (c = 0; c < self.headerRow.cells.length; c += 1) {
        colWidth = self.headerRow.cells[c].offsetWidth;
        //colWidth = $(self.headerRow.cells[c]).width();
        colMax[c] = 0;
        //if (typeof colMax[c] === 'undefined') { colMax[c] = 0; }
        if (colWidth > colMax[c]) {
            colMax[c] = colWidth;
            // change prior columns .. none to change
        }
    }
    // search row
    for (c = 0; c < self.searchRow.cells.length; c += 1) {
        colWidth = self.searchRow.cells[c].offsetWidth;
        //colWidth = $(self.searchRow.cells[c]).width();
        if (colWidth > colMax[c]) {
            colMax[c] = colWidth;
            // change prior columns
            self.headerRow.cells[c].style.minWidth = colMax[c] + 'px';
        } else if (colWidth < colMax[c]) {
            self.searchRow.cells[c].style.minWidth = colMax[c] + 'px';
        }
    }
    // data rows

    for (r = 0; r < rowsLen; r += 1) {
        // skip last row if it's a reference to yet more records that are unseen (should be click here for more records
        if (self.tableElem.rows[r].cells.length !== colMax.length) { break; }
        for (c = 0; c < self.headerRow.cells.length; c += 1) {
            //colWidth = $(self.tableElem.rows[r].cells[c]).width();
            colWidth = self.tableElem.rows[r].cells[c].offsetWidth;
            // scrollWidth, clientWidth, offsetWidth
            if (typeof colMax[c] === 'undefined') { colMax[c] = 0; }
            if (colWidth > colMax[c]) { // change prior rows' columns
                colMax[c] = colWidth;
                // change prior columns
                self.headerRow.cells[c].style.minWidth = colMax[c] + 'px';
                self.searchRow.cells[c].style.minWidth = colMax[c] + 'px';
            } else if (colWidth < colMax[c]) { // change current row's columns
                self.tableElem.rows[r].cells[c].style.minWidth = colMax[c] + 'px';
            }
        }
    }
    // find biggest cell in column and set all the other cells in this column to that
    /*
        if (cell['data-type'] === 'action') {
        if (cell['data-id'] === 'header') {
        } else if (cell['data-id'] === 'search') {
        } else {
        }
        }
    */
    // if (recordNumber==this.recordHeader) { // Header
    //   cell.style.verticalAlign = "middle";
    //   //cell.innerHTML = "<b>Action</b>";

    // } else if (recordNumber==this.recordSearchInsert) { // INSERT/ADD BUTTON
    // cell.width

};

return editable;


    }]);
