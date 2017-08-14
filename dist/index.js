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
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* 1 */
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
var isFunction = function (f) { return f ? typeof f === 'function' ? f() : f : ''; };
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
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(1);
function processMessages(type, data) {
    return { type: type, data: data };
}
exports.processMessages = processMessages;
function socketMessages(event, data, type) {
    fp_1._.switchcase({
        'pub': JSON.stringify({ 'm': ['p', event, data] }),
        'emt': JSON.stringify({ 'm': ['e', event, data] }),
        'sys': JSON.stringify({ 'm': ['s', event, data] }),
        'ping': event
    })(type);
}
exports.socketMessages = socketMessages;
function brokerMessage(channel, data) {
    return JSON.stringify({ channel: channel, data: data });
}
exports.brokerMessage = brokerMessage;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(1);
var logs_1 = __webpack_require__(0);
var EventEmitter = (function () {
    function EventEmitter() {
        this._events = {};
    }
    EventEmitter.prototype.on = function (event, listener) {
        if (!listener || typeof listener !== 'function')
            logs_1.logError('Listener must be a function');
        this._events[event] ? this._events[event].push(listener) : this._events[event] = [listener];
    };
    EventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        fp_1._.map(function (listener) { return listener.call.apply(listener, [null].concat(args)); }, this._events[event]);
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


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("cluster");

/***/ }),
/* 5 */
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
var eventemitter_1 = __webpack_require__(3);
var net_1 = __webpack_require__(6);
var TcpSocket = (function (_super) {
    __extends(TcpSocket, _super);
    function TcpSocket(port, host) {
        var _this = _super.call(this) || this;
        _this.port = port;
        _this.buffer = '';
        port instanceof net_1.Socket ? _this.socket = port : _this.socket = net_1.connect(port, host);
        _this.socket.on('end', function () { return _this.emit('disconnect'); });
        _this.socket.on('error', function (err) { return _this.emit('error', err); });
        _this.socket.on('connect', function () { return _this.emit('connect'); });
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
/* 6 */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var cluster_1 = __webpack_require__(4);
var options_1 = __webpack_require__(8);
var processMaster_1 = __webpack_require__(9);
var processWorker_1 = __webpack_require__(11);
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
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var logs_1 = __webpack_require__(0);
var Options = (function () {
    function Options(configurations) {
        if (!configurations.worker)
            throw logs_1.logError('Worker function must be provided');
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
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var cluster = __webpack_require__(4);
var fp_1 = __webpack_require__(1);
var helpers_1 = __webpack_require__(10);
var logs_1 = __webpack_require__(0);
var messages_1 = __webpack_require__(2);
function processMaster(options) {
    var ready = [];
    logs_1.logRunning('>>> Master on: ' + options.port + ', PID ' + process.pid);
    var readyPrint = function (id, pid) {
        ready[id] = id === 0 ? '>>> Broker on: ' + options.brokerPort + ', PID ' + pid : '          Worker: ' + id + ', PID ' + pid;
        if (helpers_1.count(ready) === options.workers + 1)
            fp_1._.map(function (print) { return logs_1.logRunning(print); }, ready);
    };
    var launch = function (type, i) {
        var server = cluster.fork();
        server.on('message', function (msg) { return fp_1._.switchcase({
            'ready': function () { return readyPrint(i, msg.data); }
        })(msg.type); });
        server.on('exit', function () { return options.restartWorkerOnFail ? launch(type, i) : ''; });
        server.send(messages_1.processMessages(type, i));
    };
    launch('broker', 0);
    for (var i = 1; i <= options.workers; i++)
        launch('worker', i);
}
exports.processMaster = processMaster;


/***/ }),
/* 10 */
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
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(1);
var worker_1 = __webpack_require__(12);
var broker_1 = __webpack_require__(16);
var logs_1 = __webpack_require__(0);
function processWorker(options) {
    process.on('message', function (msg) { return fp_1._.switchcase({
        'worker': function () { return new worker_1.Worker(options); },
        'broker': function () { return new broker_1.Broker(options); }
    })(msg.type); });
    process.on('uncaughtException', function (err) { return logs_1.logError('PID: ' + process.pid + '\n' + err.stack + '\n'); });
}
exports.processWorker = processWorker;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var uws = __webpack_require__(13);
var socket_1 = __webpack_require__(14);
var logs_1 = __webpack_require__(0);
var socket_2 = __webpack_require__(5);
var http_1 = __webpack_require__(15);
var eventemitter_1 = __webpack_require__(3);
var messages_1 = __webpack_require__(2);
var Worker = (function () {
    function Worker(options) {
        var _this = this;
        this.options = options;
        this.socketServer = {};
        var brokerConnection = new socket_2.TcpSocket(this.options.brokerPort, '127.0.0.1');
        brokerConnection.on('error', function (err) { return logs_1.logError('Worker' + ', PID ' + process.pid + '\n' + err.stack + '\n'); });
        brokerConnection.on('message', function (msg) { return msg === '#0' ? brokerConnection.send('#1') : _this.socketServer.emitter.emit('#publish', JSON.parse(msg)); });
        brokerConnection.on('disconnect', function () { return logs_1.logError('Broker has been disconnected'); });
        this.publish = function (channel, data) {
            brokerConnection.send(messages_1.brokerMessage(channel, data));
            _this.socketServer.emitter.emit('#publish', { channel: channel, data: data });
        };
        this.socketServer.emitter = new eventemitter_1.EventEmitter();
        this.socketServer.on = this.socketServer.emitter.on;
        this.httpServer = http_1.createServer().listen(this.options.port);
        var uWS = new uws.Server({ server: this.httpServer });
        uWS.on('connection', function (socket) { return _this.socketServer.emitter.emit('connection', new socket_1.Socket(socket, _this.socketServer.emitter, _this.options)); });
        this.options.worker.call(this);
        process.send(messages_1.processMessages('ready', process.pid));
    }
    return Worker;
}());
exports.Worker = Worker;


/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = require("uws");

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(1);
var eventemitter_1 = __webpack_require__(3);
var messages_1 = __webpack_require__(2);
var Socket = (function () {
    function Socket(socket, pubsub, options) {
        var _this = this;
        this.socket = socket;
        this.channels = [];
        this.events = new eventemitter_1.EventEmitter();
        var publishListener = function (msg) { return _this.channels.indexOf(msg.channel) !== -1 ? _this.send(msg.channel, msg.data, 'pub') : ''; };
        pubsub.on('#publish', publishListener);
        var missedPing = 0;
        var pingInterval = setInterval(function () { return (missedPing++) > 2 ? _this.disconnect(3001, 'No pongs from socket') : _this.send('#0', null, 'ping'); }, options.pingInterval);
        this.socket.on('message', function (msg) {
            msg === '#1' ? missedPing = 0 : msg = JSON.parse(msg);
            fp_1._.switchcase({
                'p': function () { return pubsub.emit(msg.m[1], msg.m[2]); },
                'e': function () { return _this.events.emit(msg.m[1], msg.m[2]); },
                's': function () { return fp_1._.switchcase({
                    'subscribe': function () { return _this.channels.indexOf(msg.m[2]) !== -1 ? _this.channels.push(msg.m[2]) : ''; },
                    'unsubscribe': function () { return _this.channels.removeEvent(msg.m[2]); }
                })(msg.m[1]); }
            })(msg.m[0]);
        });
        this.socket.on('close', function (code, msg) {
            _this.events.emit('disconnect', code, msg);
            clearInterval(pingInterval);
            _this.events.removeAllEvents();
            for (var key in _this)
                if (_this.hasOwnProperty(key))
                    _this[key] = null;
        });
        this.socket.on('error', function (err) { return _this.events.emit('error', err); });
    }
    Socket.prototype.on = function (event, fn) {
        this.socket.on(event, fn);
    };
    Socket.prototype.send = function (event, data, type) {
        this.socket.send(messages_1.socketMessages(event, data, type || 'emt'));
    };
    Socket.prototype.disconnect = function (code, msg) {
        this.socket.close(code, msg);
    };
    return Socket;
}());
exports.Socket = Socket;


/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = __webpack_require__(1);
var logs_1 = __webpack_require__(0);
var socket_1 = __webpack_require__(5);
var messages_1 = __webpack_require__(2);
var net_1 = __webpack_require__(6);
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
            socket.on('error', function (err) { return logs_1.logError('Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n'); });
            socket.on('message', function (msg) { return msg !== '#1' ? _this.broadcast(id, msg) : ''; });
            socket.on('disconnect', function () { return logs_1.logError('Server ' + id + ' has disconnected'); });
        }).listen(options.brokerPort);
        process.send(messages_1.processMessages('ready', process.pid));
    }
    Broker.prototype.broadcast = function (id, msg) {
        fp_1._.map(function (server, index) { return index !== id ? server.send(msg) : ''; }, this.servers);
    };
    return Broker;
}());
exports.Broker = Broker;


/***/ })
/******/ ]);