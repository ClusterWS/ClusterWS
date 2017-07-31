module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports=function(t){function n(e){if(r[e])return r[e].exports;var o=r[e]={i:e,l:!1,exports:{}};return t[e].call(o.exports,o,o.exports,n),o.l=!0,o.exports}var r={};return n.m=t,n.c=r,n.d=function(t,r,e){n.o(t,r)||Object.defineProperty(t,r,{configurable:!1,enumerable:!0,get:e})},n.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(r,"a",r),r},n.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},n.p="",n(n.s=4)}([function(t,n,r){"use strict";t.exports.curry=function(t){return"function"!=typeof t?console.log("Curry: No function was provided."):function n(){for(var r=arguments.length,e=Array(r),o=0;o<r;o++)e[o]=arguments[o];return e.length<t.length?function(){for(var t=arguments.length,r=Array(t),o=0;o<t;o++)r[o]=arguments[o];return n.call.apply(n,[null].concat(e,r))}:t.length?t.call.apply(t,[null].concat(e)):t}}},function(t,n,r){"use strict";var e=r(0).curry,o=function(t){this.__value=t};o.of=function(t){return new o(t)},o.prototype.map=function(t){return o.of(t(this.__value))};var u=function(t){this.__value=t};u.of=function(t){return new u(t)},u.prototype.map=function(){return this};var i=e(function(t,n,r){return r.constructor===o?n(r.__value):t(r.__value)});t.exports.Left=u,t.exports.Right=o,t.exports.either=i},function(t,n,r){"use strict";t.exports.compose=function(){for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return n.length<1?console.log("Compose: No function was provided."):n.reduce(function(t,n){return function(){return t(n.apply(void 0,arguments))}})}},function(t,n,r){"use strict";var e=function(t){this.__value=t};e.of=function(t){return new e(t)},e.prototype.map=function(t){return e.of(this.isNothing()?null:t(this.__value))},e.prototype.isNothing=function(){null===this.__value||this.__value},e.prototype.join=function(){return this.isNothing()?e.of(null):this.__value};var o=function(t,n,r){return r.isNothing()?t:n(r.__value)};t.exports.Maybe=e,t.exports.maybe=o},function(t,n,r){"use strict";var e={id:r(5).id,IO:r(6).IO,map:r(7).map,prop:r(8).prop,chain:r(9).chain,Maybe:r(3).Maybe,maybe:r(3).maybe,curry:r(0).curry,compose:r(2).compose,Left:r(1).Left,Right:r(1).Right,either:r(1).either};t.exports=e},function(t,n,r){"use strict";t.exports.id=function(t){return t}},function(t,n,r){"use strict";var e=r(2),o=function(t){this.runIO=t};o.of=function(t){return new o(function(){return t})},o.prototype.map=function(t){return new o((0,e.compose)(t,this.runIO))},o.prototype.join=function(){var t=this;return new o(function(){return t.unsafePerformIO().unsafePerformIO()})},t.exports.IO=o},function(t,n,r){"use strict";var e=r(0).curry,o=function(t,n){for(var r=-1,e=null==n?0:n.length,o=new Array(e);++r<e;)o[r]=t(n[r],r,n);return o},u=function(t,n){n=Object(n);var r={};return Object.keys(n).forEach(function(e){r[e]=t(n[e],e,n)}),r};t.exports.map=e(function(t,n){return(n instanceof Array?o:u)(t,n)})},function(t,n,r){"use strict";var e=r(0).curry;t.exports.prop=e(function(t,n){return n[t]})},function(t,n,r){"use strict";var e=function(t){return t.join()};t.exports.chain=e}]);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var _ = __webpack_require__(0);
module.exports.on = _.curry(function (type, fn) { return process.on(type, fn); });
module.exports.log = function (x) { return console.log(x); };


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _ = __webpack_require__(0);
var log = __webpack_require__(0).log;
var processWorker = __webpack_require__(3);
var cluster = __webpack_require__(4);
var processMaster_1 = __webpack_require__(5);
var options_1 = __webpack_require__(7);
var runProcess = _.curry(function (options) { return cluster.isMaster ?
    processMaster_1.processMaster(options, cluster) :
    processWorker(options); });
module.exports = _.compose(_.either(log, runProcess), options_1.loadOptions);


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _ = __webpack_require__(0);
var common = __webpack_require__(1);
var messageHandler = function (options) { return function (msg) {
    switch (msg.type) {
        case 'initBroker':
            return common.log('Init Broker');
        case 'initWorker':
            return common.log('Init Worker');
        default: break;
    }
}; };
var errorHandler = function (options) { return function (err) {
    console.log(err);
    process.exit();
}; };
var onError = _.compose(common.on('uncaughtException'), errorHandler);
var onMessage = _.compose(common.on('message'), messageHandler);
var processWorker = _.compose(onError, onMessage);
module.exports = processWorker;


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("cluster");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _ = __webpack_require__(0);
var common = __webpack_require__(1);
var messages_1 = __webpack_require__(6);
var fork = function (cluster) { return cluster.fork(); };
var sendMessage = _.curry(function (type, to) { return to.send(messages_1.processMessages(type)); });
var onExit = _.compose(common.on('exit'), function () { return function (err) { return common.log(err); }; });
var launchBroker = _.compose(onExit, sendMessage('initBroker'), fork);
var launchWorker = _.compose(onExit, sendMessage('initWorker'), fork);
function processMaster(options, cluster) {
    launchBroker(cluster);
    for (var i = 0; i < options.workers; i++)
        launchWorker(cluster);
}
exports.processMaster = processMaster;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function processMessages(type, data) {
    var message = { type: type, data: data };
    return message;
}
exports.processMessages = processMessages;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _ = __webpack_require__(0);
function loadOptions(configurations) {
    if (!configurations.worker)
        return _.Left.of('No worker was provided');
    var options = {
        port: configurations.port || 8080,
        worker: configurations.worker,
        workers: configurations.workers || 1,
        brokerPort: configurations.brokerPort || 9346,
        pingInterval: configurations.pingInterval || 20000,
        restartWorkerOnFail: configurations.restartWorkerOnFail || false
    };
    return _.Right.of(options);
}
exports.loadOptions = loadOptions;


/***/ })
/******/ ]);