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
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var curry = function (fn) {
    return function curring() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.length < fn.length ?
            function () {
                var newArgs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    newArgs[_i] = arguments[_i];
                }
                return curring.call.apply(curring, [null].concat(args, newArgs));
            } :
            fn.length ? fn.call.apply(fn, [null].concat(args)) : fn;
    };
};
var isFunction = function (f) { return typeof f === 'function' ? f() : f; };
var switchcase = curry(function (cases, key) { return key in cases ? isFunction(cases[key]) : isFunction(cases['default']); });
var mapArray = function (iteratee, array) {
    var index = -1;
    var length = array == null ? 0 : array.length;
    var result = new Array(length);
    while (++index < length)
        result[index] = iteratee(array[index], index, array);
    return result;
};
var mapObject = function (iteratee, object) {
    var result = {};
    object = Object(object);
    Object.keys(object).forEach(function (key) { return result[key] = iteratee(object[key], key, object); });
    return result;
};
var map = curry(function (fn, x) { return x instanceof Array ? mapArray(fn, x) : mapObject(fn, x); });
exports._ = {
    map: map,
    curry: curry,
    switchcase: switchcase
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function logRunning(x) {
    console.log('\x1b[36m%s\x1b[0m', x);
}
exports.logRunning = logRunning;
function logError(x) {
    console.log('\x1b[31m%s\x1b[0m', x);
}
exports.logError = logError;
function logDebug(x) {
    if (process.env.DEBUG)
        console.log('DEBUG: ', x);
}
exports.logDebug = logDebug;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function processMessages(type, data) {
    return { type: type, data: data };
}
exports.processMessages = processMessages;
var ProcessMessages = (function () {
    function ProcessMessages(type, data) {
        this.type = type;
        this.data = data;
    }
    return ProcessMessages;
}());
exports.ProcessMessages = ProcessMessages;
var ProcessErrors = (function () {
    function ProcessErrors(err, is, pid) {
        this.err = err;
        this.is = is;
        this.pid = pid;
    }
    return ProcessErrors;
}());
exports.ProcessErrors = ProcessErrors;
var EmitMessage = (function () {
    function EmitMessage(event, data) {
        this.event = event;
        this.data = data;
        this.action = 'emit';
    }
    return EmitMessage;
}());
var PublishMessage = (function () {
    function PublishMessage(channel, data) {
        this.channel = channel;
        this.data = data;
        this.action = 'publish';
    }
    return PublishMessage;
}());
var InternalMessage = (function () {
    function InternalMessage(event, data) {
        this.event = event;
        this.data = data;
        this.action = 'internal';
    }
    return InternalMessage;
}());
var BrokerMessage = (function () {
    function BrokerMessage(channel, data) {
        this.channel = channel;
        this.data = data;
    }
    return BrokerMessage;
}());
var MessageFactory = (function () {
    function MessageFactory() {
    }
    MessageFactory.emitMessage = function (event, data) {
        return JSON.stringify(new EmitMessage(event, data));
    };
    MessageFactory.publishMessage = function (channel, data) {
        return JSON.stringify(new PublishMessage(channel, data));
    };
    MessageFactory.brokerMessage = function (channel, data) {
        return JSON.stringify(new BrokerMessage(channel, data));
    };
    MessageFactory.internalMessage = function (event, data) {
        return JSON.stringify(new InternalMessage(event, data));
    };
    MessageFactory.processErrors = function (err, is, pid) {
        return new ProcessErrors(err, is, pid);
    };
    MessageFactory.processMessages = function (type, data) {
        return new ProcessMessages(type, data);
    };
    return MessageFactory;
}());
exports.MessageFactory = MessageFactory;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("cluster");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var cluster_1 = __webpack_require__(3);
var options_1 = __webpack_require__(6);
var processMaster_1 = __webpack_require__(7);
var processWorker_1 = __webpack_require__(9);
var ClusterWS = (function () {
    function ClusterWS(configurations) {
        this.configurations = configurations;
        if (ClusterWS.instance)
            return;
        ClusterWS.instance = this;
        var options = new options_1.Options(this.configurations || {});
        cluster_1.isMaster ? processMaster_1.processMaster(options) : processWorker_1.processWorker(options);
    }
    return ClusterWS;
}());
exports.ClusterWS = ClusterWS;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Options = (function () {
    function Options(configurations) {
        if (!configurations.worker)
            throw '\n\x1b[31mWorker function must be provided\x1b[0m';
        this.port = configurations.port || 80;
        this.worker = configurations.worker;
        this.workers = configurations.workers || 1;
        this.brokerPort = configurations.brokerPort || 9346;
        this.pingInterval = configurations.pingInterval || 20000;
        this.restartWorkerOnFail = configurations.restartWorkerOnFail || false;
    }
    return Options;
}());
exports.Options = Options;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var cluster = __webpack_require__(3);
var fp_1 = __webpack_require__(0);
var utils_1 = __webpack_require__(8);
var logs_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(2);
function processMaster(options) {
    var ready = [];
    logs_1.logRunning('>>> Master on: ' + options.port + ', PID ' + process.pid);
    var readyPrint = function (id, pid) {
        ready[id] = id === 0 ? '>>> Broker on: ' + options.brokerPort + ', PID ' + pid : '          Worker: ' + id + ', PID ' + pid;
        if (utils_1.count(ready) === options.workers + 1)
            fp_1._.map(function (print) { return logs_1.logRunning(print); }, ready);
    };
    var launch = function (type, i) {
        var server = cluster.fork();
        server.on('message', function (msg) {
            fp_1._.switchcase({
                'ready': function () { return readyPrint(i, msg.data); },
                'default': ''
            })(msg.type);
        });
        server.on('exit', function () { return options.restartWorkerOnFail ? launch(type, i) : ''; });
        server.send(messages_1.processMessages(type, i));
    };
    launch('broker', 0);
    for (var i = 1; i <= options.workers; i++)
        launch('worker', i);
}
exports.processMaster = processMaster;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function count(arr) {
    var size = 0;
    for (var i = 0, len = arr.length; i < len; i++)
        arr[i] ? size++ : '';
    return size;
}
exports.count = count;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(0);
var broker_1 = __webpack_require__(10);
var logs_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(2);
function processWorker(options) {
    process.on('message', function (msg) { return fp_1._.switchcase({
        'worker': function () {
            process.send(messages_1.processMessages('ready', process.pid));
        },
        'broker': function () { return new broker_1.Broker(options); },
        'default': ''
    })(msg.type); });
    process.on('uncaughtException', function (err) {
        logs_1.logError('PID: ' + process.pid + '\n' + err.stack + '\n');
    });
}
exports.processWorker = processWorker;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(0);
var logs_1 = __webpack_require__(1);
var socket_1 = __webpack_require__(11);
var messages_1 = __webpack_require__(2);
var net_1 = __webpack_require__(4);
var Broker = (function () {
    function Broker(options) {
        var _this = this;
        this.options = options;
        this.servers = [];
        this.broker = net_1.createServer(function (s) {
            var id = _this.servers.length;
            var socket = new socket_1.TcpSocket(s);
            var ping = setInterval(function () { return socket.send('#0'); }, 20000);
            _this.servers[id] = socket;
            socket.on('message', function (msg) { return msg !== '#1' ? _this.broadcast(id, msg) : ''; });
            socket.on('error', function (err) { return logs_1.logError('Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n'); });
            socket.on('disconnect', function () { return logs_1.logError('Server ' + id + ' has disconnected'); });
        }).listen(options.brokerPort);
        process.send(messages_1.processMessages('ready', process.pid));
    }
    Broker.prototype.broadcast = function (id, msg) {
        fp_1._.map(function (server, index) { index !== id ? server.send(msg) : ''; }, this.servers);
    };
    return Broker;
}());
exports.Broker = Broker;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var eventemitter_1 = __webpack_require__(12);
var net_1 = __webpack_require__(4);
var TcpSocket = (function (_super) {
    __extends(TcpSocket, _super);
    function TcpSocket(port, host) {
        var _this = _super.call(this) || this;
        _this.port = port;
        _this.buffer = '';
        port instanceof net_1.Socket ? _this.socket = port : _this.socket = net_1.connect(port, host);
        _this.socket.on('connect', function () { return _this.emit('connect'); });
        _this.socket.on('end', function () { return _this.emit('disconnect'); });
        _this.socket.on('error', function (err) { return _this.emit('error', err); });
        _this.socket.on('data', function (data) {
            var str = data.toString();
            var i = str.indexOf('\n');
            if (i === -1)
                return _this.buffer += str;
            _this.emit('message', _this.buffer + str.slice(0, i));
            var next = i + 1;
            while ((i = str.indexOf('\n', next)) !== -1) {
                _this.emit('message', str.slice(next, i));
                next = i + 1;
            }
            _this.buffer = str.slice(next);
        });
        return _this;
    }
    TcpSocket.prototype.send = function (data) {
        this.socket.write(data + '\n');
    };
    return TcpSocket;
}(eventemitter_1.EventEmitter));
exports.TcpSocket = TcpSocket;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(0);
var logs_1 = __webpack_require__(1);
var EventEmitter = (function () {
    function EventEmitter() {
        this._events = {};
    }
    EventEmitter.prototype.on = function (event, listener) {
        if (!listener || typeof listener === 'function')
            logs_1.logError('Listener must be a function');
        this._events ? this._events.push(listener) : this._events = [listener];
    };
    EventEmitter.prototype.emit = function (event) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        fp_1._.map(function (listener) { return listener.call.apply(listener, [_this].concat(args)); }, this._events[event]);
    };
    EventEmitter.prototype.removeListener = function (event, listener) {
        var _this = this;
        fp_1._.map(function (l, index) { return l === listener ? _this._events[event].splice(index, 1) : ''; }, this._events[event]);
    };
    EventEmitter.prototype.removeEvent = function (event) {
        this._events[event] = null;
    };
    EventEmitter.prototype.removeAllEvents = function () {
        this._events = {};
    };
    EventEmitter.prototype.exist = function (event) {
        return this._events[event];
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;


/***/ })
/******/ ]);