'use strict';
/* usage examples .. must have .. style="height: 300px;" class="col-xs-6" .. for sizing and containment to work
    <rad style="height: 300px;" class="col-xs-6" tablename="'transaction'"></rad>
    <rad style="height: 300px;" class="col-xs-6" crud rowclick="select" highlight selectcallback="focusTx" tablename="'transaction'" ref="ref" ></rad>
*/

angular.module('nglogApp')
    .directive('rad', ['$compile', 'lgOrm', 'editable', 'util', function ($compile, lgOrm, editable, util) {
        return {
            // controller: function($scope, $element, $attrs) {
            //   $scope.getElementDimensions = function () {
            //     return { 'h': $element.height(), 'w': $element.width() };
            //   };

            //   $scope.$watch($scope.getElementDimensions, function (newValue, oldValue) {
            //     var a = $element;
            //     //<<perform your logic here using newValue.w and set your variables on the scope>>
            //   }, true);

            //   $element.bind('resize', function () {
            //     $scope.$apply();
            //   });    
            // },
            template: '',
            restrict: 'E',
            scope : {
                tablename : '=',
//        tableclass : '@',
                selectcallback : '&',
                rowclick : '@',
//        selectedId : '=?',
                options : '=?',
                actions : '=?',
                ref : '=?'
            },
            link: function postLink(scope, element, attrs) {
                
var self = this;
if (element[0].id === '') {
    element[0].id = Math.random();
    util.log('trace', 'rad.link', element[0].id + ' for ' + attrs.tablename + ' or ' + scope.tablename);
}
element[0].style.overflow = 'scroll';


scope.loadOnSuccessRetryOnFailure = function (success) {
    util.time('rad.loadOnSuccessRetryOnFailure');
    if (success) {
        scope.status = 'successful';
        // kill waiting thing
        while (element[0].hasChildNodes()) { element[0].removeChild(element[0].lastChild); }

        if (scope.options === null) {
            scope.options = {
                tableclass : scope.tableclass,
                tablename : scope.tablename
            };
        } else {
        }
        scope.options.tableclass = 'table table-striped table-bordered table-condensed table-hover';

        scope.options.containerId = element[0].id; // maybe just pass container dom element
        scope.options.db = lgOrm;
        scope.options.schemas = lgOrm.schemas; // copied before edited by editable

        // defaults
        if (typeof scope.actions !== 'undefined') {
            scope.options.actions = scope.actions;
        }

        // SELECT: highlight check selectcallback=''
        scope.options.singleSelect = (typeof attrs.multi === 'undefined');
        scope.options.highlight = (typeof attrs.highlight !== 'undefined');
        scope.options.check = typeof attrs.check !== 'undefined';
        if (scope.options.check) {
            scope.options.selectedButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-ok"></i>'; // bookmark, check
            scope.options.unselectedButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-unchecked"></i>'; // unchecked
        }
        if (typeof attrs.selectcallback !== 'undefined') {
            scope.options.onselect = scope.selectcallback(); // gets a proper reference to the function
        }
        //   if (attrs.select === '' || attrs.select === 'buttons' || attrs.select === 'button') {
        //     scope.options.select = 'buttons';
        //   } else if (attrs.select === 'highlight') {
        //     scope.options.select = 'highlight';
        //   }
        // }

        scope.options.toolsButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-cog"></i>';

        scope.options.undoType = 'vim'; // vim/word, none

        if (typeof attrs.recordlimit !== 'undefined') {
            scope.options.recordLimit = attrs.recordlimit; // notice difference in case???!?!?!??
        }


        if (typeof attrs.crud === 'undefined') {
            scope.options.disableAdd = true;
            scope.options.disableRemove = true;
            scope.options.disableEdit = true;
        } else {
            scope.options.removeButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-trash"></i>';
            scope.options.addButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-plus"></i>';
            scope.options.editButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-pencil"></i>'; // edit
            scope.options.undoButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-step-backward"></i>'; // backward
            scope.options.redoButtonHTML = '<i class="btn btn-xs glyphicon glyphicon-step-forward"></i>'; // backward
            if (typeof attrs.hide !== 'undefined') {
                scope.options.crudHidden = true;
            }
        }

        if (typeof attrs.rowclick === 'undefined') {
            // they didn't specify so i have to guess
            
            if (typeof attrs.crud !== 'undefined') {
                scope.options.rowClick = 'edit';
            } else if (typeof attrs.selectcallback !== 'undefined') {
                scope.options.rowClick = 'select';
            } else {
                scope.options.rowClick = 'none';
            }
        } else {
            scope.options.rowClick = scope.rowclick;
        }
        
        scope.ref = new editable(scope.options);
    } else {
        scope.status = 'unsuccessful';
        if (!element[0].hasChildNodes()) {
            var markup = '<span>Network Failure: This feature is not available until network connection can be restored.</span>' +
                '<div class="progress progress-striped active">' +
                '<div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">' +
                '<span id="lto">Last tried on ' + new Date()+ '</span>' +
                '</div>' + 
                '</div>';
            $compile(markup)(scope).appendTo(element);
        }
        document.getElementById('lto').innerHTML = 'last tried on ' + new Date();
        setTimeout(function () {
            if (lgOrm.tablesList.indexOf(scope.tablename) === -1) {
                scope.loadOnSuccessRetryOnFailure(true);
            } else {
                lgOrm.whenLoaded(lgOrm.tablesList, scope.loadOnSuccessRetryOnFailure);
            }
        },2000);
    }
    util.timeEnd('rad.loadOnSuccessRetryOnFailure', scope.tablename);
};


scope.status = 'uninitiated';
scope.options = null;
scope.load = function() {
    if (typeof scope.tablename !== 'undefined' || (typeof scope.options !== 'undefined'/* && scope.options !== null*/)) {
        if (scope.status !== 'uninitiated' && scope.tablename !== 'undefined') {
            scope.options = null;
        }
        // !!!!!! be more specific later
        // search scope.tablename for dependencies .. if it doesn't appear in tablesList then just call it
        if (lgOrm.tablesList.indexOf(scope.tablename) === -1) {
            scope.loadOnSuccessRetryOnFailure(true);
        } else {
            lgOrm.whenLoaded(lgOrm.tablesList, scope.loadOnSuccessRetryOnFailure);
        }
        scope.status = 'initiated';
    }
};
scope.$watch('tablename', scope.load);



            } // link
        }; // returned object
    }]);  // directive
