'use strict';

angular.module('nglogApp')
    .service('util', ['$location', function util($location) {

var Util = function () {
    this.registeredFunctions = {};
    this.subscribers = {};

    // what levels I want to see
    // how I want it presented: alert, debugger, console.log, alert/debugger, none
    this.logConfig = {
        deprecated : 'trace',
        fatal : 'debugger',
        error : 'alert/debugger',
        warn : 'console.log',
        info : 'none',
        debug : 'none',
        watch : 'none', // should be same as trace
        trace : 'none',
        all : 'none', // what's the meaning of this
        time : 'none-console.log'
    };
    this.timeouts = {};
    this.timeCutoff = -1;

    window.globalUtil = this;
};

Util.prototype.repeat = function(string, n){
    var result = '';
    for (var i = n; i > 0; i--) {
        result += string;
    };
    return result;
};


Util.prototype.falsy = function(ar) { // missing empty object case
    return !ar || (typeof ar === 'object' && ar.length === 0);
};

Util.prototype.delay = function (key, ms, func) {
    if(this.timeouts[key]) { clearTimeout(this.timeouts[key]); }
    this.timeouts[key] = setTimeout(function () {
        func();
    }, ms);
};

Util.prototype.time = function(objectMethod) {
    if (this.logConfig.time !== 'console.log') { return; }
    if (typeof this.timers === 'undefined') { this.timers = []; }
    // this.timers.push({name : objectMethod, startTime : new Date().getTime()});
    this.timers.push({name : objectMethod, startTime : performance.now()});
};
Util.prototype.timeEnd = function(objectMethod, msg) {
    var i, tabs, timer, remainingTime, totalTime, lastTimerIndex;
    if (this.logConfig.time !== 'console.log') { return; }
    timer = this.timers.pop();
    lastTimerIndex = this.timers.length - 1;
    if (timer.name !== objectMethod) {
        this.log('fatal', objectMethod, 'Timer stack assumption violated.');
    }
    totalTime = performance.now() - timer.startTime;
    remainingTime = totalTime - (typeof timer.calledFunctionsTime !== 'undefined'
                    ? timer.calledFunctionsTime : 0);
    if (remainingTime > this.timeCutoff) {
        tabs = '';
        for (i = lastTimerIndex; i >= 0; i--) {
            tabs += '\t';
        };
        console.log(tabs + remainingTime.toFixed(0) + ' ms\t ' + objectMethod + ' : ' + msg);
    }
    // exclude known times from runs
    if (lastTimerIndex !== -1) {
        if (typeof this.timers[lastTimerIndex].calledFunctionsTime === 'undefined') {
            this.timers[lastTimerIndex].calledFunctionsTime = totalTime;
        } else {
            this.timers[lastTimerIndex].calledFunctionsTime += totalTime;
        }
    }
};

Util.prototype.nsPush = function(obj, property, toAdd) {
    if (typeof obj[property] === 'undefined') {
        obj[property] = [toAdd];
    } else {
        obj[property].push(toAdd);
    }
};

Util.prototype.nsPlusEquals = function(obj, property, toAdd) {
    if (typeof obj[property] === 'undefined') {
        obj[property] = toAdd;
    } else {
        obj[property] += toAdd;
    }
};


Util.prototype.swapIndexes = function(array, i, k) {
    var temp = array[i];
    array[i] = array[k];
    array[k] = temp;
}

Util.prototype.timeAsync = function(objectMethod) {
    if (typeof this.timersAsync === 'undefined') { this.timersAsync = {}; }
    this.timersAsync[objectMethod] = new Date().getTime();
};
Util.prototype.timeAsyncEnd = function(objectMethod, msg) {
    var startTime = this.timersAsync[objectMethod];
    if (typeof startTime === 'undefined') {
        this.log('warn', objectMethod, 'Doesn\'t make sense to call util.timeEnd before util.time.');
    }
    delete this.timersAsync[objectMethod]
    if (this.logConfig.time === 'console.log') {
        var ms = new Date().getTime() - startTime;
        if (ms > this.timeCutoff) {
            console.log(ms + ' ms\t ' + objectMethod + ' : ' + msg);
            // console.timeEnd(objectMethod);
        }
    }
};

Util.prototype.capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

Util.prototype.log = function(level, objectMethod, msg) {
    var logType = this.logConfig[level];
    if (typeof logType === 'undefined') {
        alert('Util.log: needs util.logConfig setup prior to use.');
    } else if (logType === 'none') {
        return;
    }
    var report = level.toUpperCase() + ' : ' + objectMethod + (typeof msg === 'undefined' ? '' : ' : ' + msg);
    switch (logType) {
    case 'alert/debugger':
        alert(report);
        debugger;
        break;
    case 'alert':
        alert(report);
        break;
    case 'debugger':
        console.log(report);
        debugger;
        break;
    case 'console.log':
        console.log(report);
        break;
    case 'trace':
        console.log(report);
        console.trace();
        break;
    default:
        alert('Util.log: "' + logType + '" is unknown. Please don\'t use it in util.logConfig');
        break;
    }
};

Util.prototype.csvToAr = function(s) {
    if (typeof s === 'undefined' || s === '') return [];
    if (typeof s !== 'string') debugger;
    return s.split(',');
};

Util.prototype.nsLowerCase = function(s) { 
    return (typeof s === 'string' ? s.toLowerCase() : '');
};

Util.prototype.nsContains = function(ar, s) {
    if (typeof ar === 'string' || Array.isArray(ar)) {
        return ar.indexOf(s) !== -1;
    }
    return false;
};

// old
Util.prototype.removeStringFromArray = function(ar, str) {
    var index = ar.indexOf(str);
    if (index !== -1) ar.splice(index, 1);
    else this.log('fatal', 'Util.removeStrFromCsv', 'could not find string in array to remove');
    return ar;
};
Util.prototype.removeStrFromCsv = function(base, str) {
    return this.removeStringFromArray(base.split(','), str).join(',');
};
// improved
Util.prototype.fromCsvRemoveStr = function(base, str) {
    var ar = base.split(',');
    var numberRemoved = this.fromArrayRemoveItemInPlace(ar, str);
    return { string : ar.join(','), numberRemoved : numberRemoved };
};
Util.prototype.fromArrayRemoveItemInPlace = function(ar, item) {
    var numberRemoved = 0;
    // for (var i = ar.length - 1; i >= 0; i--) {
    for (var i = ar.length; i--;) {
        if (ar[i] === item) {
            numberRemoved += 1;
            ar.splice(i, 1);
        }
    };
    return numberRemoved;
};
// end
Util.prototype.concatWithComma = function(base, str) { return base ? base + ',' + str : str; };
Util.prototype.concatWith = function(base, str, delimiter) { return base ? base + delimiter + str : str; };

// USED BY: crud service
Util.prototype.safePropertyUpdate = function (newest, editable, oldest, properties) {
    var rightName, leftName, prop, i;
    if (Array.isArray(properties)) {
        for (i = 0; i < properties.length; i++) {
            prop = properties[i];
            if (typeof prop === 'string') {
                if (oldest[prop] === editable[prop]) { // has not been modified so its okay to update
                    editable[prop] = oldest[prop] = newest[prop] ? this.clone(newest[prop]) : '';
                } else {
                    // since the user has already edited it, this new change shouldn't overwrite their edit
                }
            } else {
                this.log('fatal', 'util.safePropertyUpdate', 'uncovered case of array of objects');
            }
        }
    } else {
        for (leftName in properties) {
            rightName = properties[leftName];
            if (oldest[leftName] === editable[rightName]) { // has not been modified so its okay to update
                editable[rightName] = oldest[leftName] = newest[leftName] ? this.clone(newest[leftName]) : '';
            }
        };
    }
};
Util.prototype.copyPropertiesLeft = function (left, right, properties) {
    var rightName, leftName, prop, i;
    if (Array.isArray(properties)) {
        for (i = 0; i < properties.length; i++) {
            prop = properties[i];
            if (typeof prop === 'string') {
                left[prop] = right[prop] ? this.clone(right[prop]) : '';
            } else {
                this.log('fatal', 'util.copyPropertiesLeft', 'uncovered case of array of objects');
            }
        }
    } else {
        for (leftName in properties) {
            rightName = properties[leftName];
            left[leftName] = right[rightName] ? this.clone(right[rightName]) : '';
        };
    }
};
Util.prototype.copyPropertiesRight = function (left, right, properties) {
    var rightName, leftName, prop, i;
    if (Array.isArray(properties)) {
        for (i = 0; i < properties.length; i++) {
            prop = properties[i];
            if (typeof prop === 'string') {
                right[prop] = left[prop] ? this.clone(left[prop]) : '';
            } else {
                this.log('fatal', 'util.copyPropertiesRight', 'uncovered case of array of objects');
            }
        }
    } else {
        for (leftName in properties) {
            rightName = properties[leftName];
            right[rightName] = left[leftName] ? this.clone(left[leftName]) : '';
        };
    }
};
Util.prototype.propertiesHaveChanged = function(left, right, properties) {
    var leftName, rightName, prop, i;
    if (Array.isArray(properties)) {
        for (i = 0; i < properties.length; i++) {
            prop = properties[i];
            if (!this.roughlyEquals(left[prop], right[prop])) {
                return true;
            }
        }
    } else {
        for (leftName in properties) {
            rightName = properties[leftName];
            if (!this.roughlyEquals(left[leftName], right[rightName])) {
                return true;
            }
        };
    }
    return false;
};
Util.prototype.roughlyEquals = function (lv,rv) {
    if (Array.isArray(lv) && typeof rv === 'string') {
        return lv.join(',') === rv;
    } else if (Array.isArray(rv) && typeof lv === 'string') {
        return rv.join(',') === lv;
    } else if (this.isBlank(rv) && this.isBlank(lv)) {
        return true;
    } else {
        return this.deepEquals(lv, rv);
    }
};

Util.prototype.isBlank = function(value) {
    return value === undefined || value === null || value === '';
}


Util.prototype.addMinute = function(currentTime) {
    return new Date(new Date(currentTime).getTime() + 1000*60);
};


Util.prototype.dateObjToMMddYYYY = function (d) {
    var time, timeAr, f;
    // prevent clutter from unspecificed time
    if (!d) { return ''; }
    if (typeof d.getHours === 'undefined') { d = new Date(d); }
    if (isNaN(d)) { return ''; }
    if (d.getHours() + d.getMinutes() === 0) {
        time = '';
    } else {
        timeAr = [
            ('0' + d.getHours()).slice(-2),
            ('0' + d.getMinutes()).slice(-2)
        ];
        if (d.getMilliseconds() !== 0 || d.getSeconds() !== 0) {
            timeAr.push(('0' + d.getSeconds()).slice(-2));
            timeAr.push(('00' + d.getMilliseconds()).slice(-3));
        }
        time = ' ' + timeAr.join(':');
    }
    f = [('0' + (d.getMonth()+1)).slice(-2), // month and day are switched around here b/c of how new Date(a) parsed the date
             ('0' + (d.getDate())).slice(-2),
             d.getFullYear()].join('/')+time;
    //  2013-02-11T06:00:00.000Z
    //  10/09/2014 11:00
    return f;
};

Util.prototype.dateTohhmmss = function(d) {
    var timeAr = [
        ('0' + d.getHours()).slice(-2),
        ('0' + d.getMinutes()).slice(-2),
        ('0' + d.getSeconds()).slice(-2)
    ];
    return timeAr.join(':');
};

Util.prototype.findIndexOfObjectInArrayWithProperty = function(array, property, value, startingIndex, direction) {
    if (direction > 0) {
        for (var i = startingIndex || 0; i < array.length; i++) {
            if (array[i][property] === value) return i;
        }
    } else {
        for (var i = startingIndex || (array.length - 1); i >= 0; i--) {
            if (array[i][property] === value) return i;
        }
    }
    this.log('fatal', 'Util.findIndexOfObjectInArrayWithProperty', 'couldn\'t find "' + value + '" within "' + JSON.stringify(array) + '"!');
};
Util.prototype.inArrayFindIndexWhereFieldHasValueStartingAtGoing = Util.prototype.findIndexOfObjectInArrayWithProperty;

Util.prototype.ms = function(callback) {
    var st = new Date().getTime();
    callback();
    return new Date().getTime() - st;
};

Util.prototype.ab2str = function(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
};

Util.prototype.str2ab = function(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

Util.prototype.getByteLen = function(normal_val) {
    normal_val = String(normal_val);
    var byteLen = 0;
    for (var i = 0; i < normal_val.length; i++) {
            var c = normal_val.charCodeAt(i);
            byteLen += c < (1 <<  7) ? 1 :
                                 c < (1 << 11) ? 2 :
                                 c < (1 << 16) ? 3 :
                                 c < (1 << 21) ? 4 :
                                 c < (1 << 26) ? 5 :
                                 c < (1 << 31) ? 6 : Number.NaN;
    }
    return byteLen;
};

Util.prototype.registerFunction = function (id, func) {
    this.registeredFunctions[id] = func;
};

Util.prototype.callFunction = function (id) {
    if (typeof this.registeredFunctions[id] !== 'undefined') {
        this.registeredFunctions[id]();
        return true;
    } else {
        return false;
    }
};

Util.prototype.focusDammit = function() {
    var $this = $(this);
    $this.focus();
    $this.children().each(Util.prototype.focusDammit);
};

Util.prototype.hasRealChange = function(n,o) {
    return n !== o && typeof n !== 'undefined';
};



// -----------------------------------------------------------------------------
//          Message Bus
Util.prototype.publish = function(topic, message) {
    for (var listener in this.subscribers[topic]) {
        this.subscribers[topic][listener](message);
    }
    // this.autoMapToArray(this.publications, [topic], message);
};
Util.prototype.subscribe = function(topic, listener, callback) {
    this.autoMap(this.subscribers, [topic, listener], callback);
    window.pubsub = this.printPubSub.bind(this);
};
Util.prototype.unsubscribe = function(topic, listener) {
    delete this.subscribers[topic][listener]
};
Util.prototype.printPubSub = function() {
    console.log("Subscribers:");
    for (var topic in this.subscribers) {
        console.log("  " + topic + " Topic");
        for (var listener in this.subscribers[topic]) {
            console.log("    " + listener + " Listener");
        }
    }
    // console.log("Publications:");
    // for (var topic in this.publications) {
    //     console.log("  " + topic + " Topic");
    //     for (var listener in this.subscribers[topic]) {
    //         console.log("    " + listener + " Listener");
    //     }
    // }
};
// Util.prototype.autoMap = function() {
//     var len = arguments.length;
//     if (len < 2) { throw new "Util.prototype.autoMap takes at least 2 args"; }
//     var last = len - 1;
//     var base = arguments[0];
//     for (var i = 1; i < last; i++) {
//         if (typeof base
//         arguments[i]
//     }
//     if (arguments.length)
// };
// Util.prototype.autoMapToArray = function(obj, keys, value) { // used to create objects if none are present for keys along the path the object I want to store
//     var map = obj;
//     if (typeof map === 'undefined') { map = {}; }
//     if (keys.length === 0) {
//         // obj = {};
//         throw new "Util.autoMap doesn't make sense for value to be assigned to map without a key"
//     }
//     for (var a = 0; a < keys.length - 1; a += 1) {
//         if (typeof map[keys[a]] === "undefined") {
//             map[keys[a]] = {};
//         }
//         map = map[keys[a]]; // move frame of reference
//     }
//     map[keys[keys.length - 1]] = value; // have to do one shy of the end so I'm still in an object since I don't want to reset a primative but mutate object state
// };
Util.prototype.autoMap = function(obj, keys, value) { // used to create objects if none are present for keys along the path the object I want to store
    var map = obj;
    if (typeof map === 'undefined') { map = {}; }
    if (keys.length === 0) {
        // obj = {};
        throw new "Util.autoMap doesn't make sense for value to be assigned to map without a key";
    }
    for (var a = 0; a < keys.length - 1; a += 1) {
        if (typeof map[keys[a]] === "undefined") {
            map[keys[a]] = {};
        }
        map = map[keys[a]]; // move frame of reference
    }
    map[keys[keys.length - 1]] = value; // have to do one shy of the end so I'm still in an object since I don't want to reset a primative but mutate object state
};

// -----------------------------------------------------------------------------



// client side implementation of OjectId courtesy of https://github.com/justaprogrammer/ObjectId.js/blob/master/src/main/javascript/Objectid.js
var objectId = (function () {
        var increment = 0;
        var pid = Math.floor(Math.random() * (32767));
        var machine = Math.floor(Math.random() * (16777216));

        if (typeof (localStorage) !== 'undefined') {
                var mongoMachineId = parseInt(localStorage.mongoMachineId);
                if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
                        machine = Math.floor(localStorage.mongoMachineId);
                }
                // Just always stick the value in.
                localStorage.mongoMachineId = machine;
                document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT';
        }
        else {
                var cookieList = document.cookie.split('; ');
                for (var i in cookieList) {
                        var cookie = cookieList[i].split('=');
                        if (cookie[0] === 'mongoMachineId' && cookie[1] >= 0 && cookie[1] <= 16777215) {
                                machine = cookie[1];
                                break;
                        }
                }
                document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT';

        }

        function ObjId() {
                if (!(this instanceof objectId)) {
                        return new objectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
                }

                if (typeof (arguments[0]) === 'object') {
                        this.timestamp = arguments[0].timestamp;
                        this.machine = arguments[0].machine;
                        this.pid = arguments[0].pid;
                        this.increment = arguments[0].increment;
                }
                else if (typeof (arguments[0]) === 'string' && arguments[0].length === 24) {
                        this.timestamp = Number('0x' + arguments[0].substr(0, 8));
                        this.machine = Number('0x' + arguments[0].substr(8, 6));
                        this.pid = Number('0x' + arguments[0].substr(14, 4));
                        this.increment = Number('0x' + arguments[0].substr(18, 6));
                }
                else if (arguments.length === 4 && arguments[0] !== null && typeof arguments[0] !== 'undefined') {
                        this.timestamp = arguments[0];
                        this.machine = arguments[1];
                        this.pid = arguments[2];
                        this.increment = arguments[3];
                }
                else {
                        this.timestamp = Math.floor(new Date().valueOf() / 1000);
                        this.machine = machine;
                        this.pid = pid;
                        this.increment = increment++;
                        if (increment > 0xffffff) {
                                increment = 0;
                        }
                }
        }
        return ObjId;
})();

objectId.prototype.getDate = function () {
        return new Date(this.timestamp * 1000);
};

objectId.prototype.toArray = function () {
        var strOid = this.toString();
        var array = [];
        var i;
        for(i = 0; i < 12; i++) {
                array[i] = parseInt(strOid.slice(i*2, i*2+2), 16);
        }
        return array;
};

// Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
objectId.prototype.toString = function () {
        var timestamp = this.timestamp.toString(16);
        var machine = this.machine.toString(16);
        var pid = this.pid.toString(16);
        var increment = this.increment.toString(16);
        return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
                     '000000'.substr(0, 6 - machine.length) + machine +
                     '0000'.substr(0, 4 - pid.length) + pid +
                     '000000'.substr(0, 6 - increment.length) + increment;
};
// should not have a 'new', if it does, it will not persist to the database
Util.prototype.getObjectId = objectId;


Util.prototype.numberCSVToArrayOfNumbers = function(string) {
    var numberList = []; numberList.push.apply(numberList, string.split(",").map(Number));
    return numberList;
};

Util.prototype.clone = function(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
            var copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = this.clone(obj[i]);
            }
            return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
            }
            return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};

Util.prototype.deepEquals = function() {
    var i, l, leftChain, rightChain;

    function compare2Objects (x, y) {
        var p;
        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
                 return true;
        }

        // Compare primitives and functions.     
        // Check if both arguments link to the same object.
        // Especially useful on step when comparing prototypes
        if (x === y) { return true; }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
             (x instanceof Date && y instanceof Date) ||
             (x instanceof RegExp && y instanceof RegExp) ||
             (x instanceof String && y instanceof String) ||
             (x instanceof Number && y instanceof Number)) {
                return x.toString() === y.toString();
        }

        // At last checking prototypes as good a we can
        if (!(x instanceof Object && y instanceof Object)) { return false; }
        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) { return false; }
        if (x.constructor !== y.constructor) { return false; }
        if (x.prototype !== y.prototype) { return false; }

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) { return false; }

        // Quick checking of one object beeing a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
                if (p === '$$hashKey') continue;
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) { return false; }
                else if (typeof y[p] !== typeof x[p]) { return false; }
        }

        for (p in x) {
                if (p === '$$hashKey') continue;
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) { return false;
                } else if (typeof y[p] !== typeof x[p]) { return false; }

                switch (typeof (x[p])) {
                        case 'object':
                        case 'function':
                                leftChain.push(x);
                                rightChain.push(y);
                                if (!compare2Objects (x[p], y[p])) {
                                        return false;
                                }
                                leftChain.pop();
                                rightChain.pop();
                                break;

                        default:
                                if (x[p] !== y[p]) {
                                        return false;
                                }
                                break;
                }
        }
        return true;
    }

    if (arguments.length < 1) {
        return true; //Die silently? Don't know how to handle such case, please help...
        // throw "Need two or more arguments to compare";
    }

    for (i = 1, l = arguments.length; i < l; i++) {
            leftChain = []; //Todo: this can be cached
            rightChain = [];
            if (!compare2Objects(arguments[0], arguments[i])) {
                    return false;
            }
    }

    return true;
};

        return new Util();
    }]);
