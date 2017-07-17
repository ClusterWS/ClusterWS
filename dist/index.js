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
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = (function () {
    function EventEmitter() {
        this._events = {};
    }
    EventEmitter.prototype.on = function (event, listener) {
        if (!listener && typeof listener === 'function')
            throw 'Function must be provided';
        this._events[event] = this._events[event] || [];
        this._events[event].push(listener);
    };
    EventEmitter.prototype.emit = function (event) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        if (this.exist(event)) {
            for (var i = 0, len = this._events[event].length; i < len; i++) {
                this._events[event][i].apply(this, rest);
            }
        }
    };
    EventEmitter.prototype.removeListener = function (event, listener) {
        if (this.exist(event)) {
            var len = this._events[event].length;
            while (len--) {
                if (this._events[event][len] === listener) {
                    this._events[event].splice(len, 1);
                }
            }
        }
        return;
    };
    EventEmitter.prototype.removeEvent = function (event) {
        if (this.exist(event)) {
            this._events[event] = null;
            delete this._events[event];
        }
    };
    EventEmitter.prototype.removeAllEvents = function () {
        for (var key in this._events) {
            if (this._events.hasOwnProperty(key)) {
                this._events[key] = null;
                delete this._events[key];
            }
        }
    };
    EventEmitter.prototype.exist = function (event) {
        return this._events[event];
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("cluster");

/***/ }),
/* 3 */
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
var eventEmitter_1 = __webpack_require__(1);
var net_1 = __webpack_require__(4);
var TcpSocket = (function (_super) {
    __extends(TcpSocket, _super);
    function TcpSocket(port, host) {
        var _this = _super.call(this) || this;
        _this.port = port;
        _this.host = host;
        _this.dataBuffer = '';
        if (port instanceof net_1.Socket) {
            _this.socket = port;
        }
        else {
            _this.socket = net_1.connect(port, host);
        }
        _this.socket.on('connect', function () {
            _this.emit('connect');
        });
        _this.socket.on('data', function (data) {
            var str = data.toString();
            var i = str.indexOf('\n');
            if (i === -1) {
                _this.dataBuffer += str;
                return;
            }
            _this.emit('message', _this.dataBuffer + str.slice(0, i));
            var nextPart = i + 1;
            while ((i = data.indexOf('\n', nextPart)) !== -1) {
                _this.emit('message', str.slice(nextPart, i));
                nextPart = i + 1;
            }
            _this.dataBuffer = str.slice(nextPart);
        });
        _this.socket.on('end', function () {
            _this.emit('disconnect');
        });
        _this.socket.on('error', function (err) {
            _this.emit('error', err);
        });
        return _this;
    }
    TcpSocket.prototype.send = function (data) {
        this.socket.write(data + '\n');
    };
    return TcpSocket;
}(eventEmitter_1.EventEmitter));
exports.TcpSocket = TcpSocket;


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var cluster_1 = __webpack_require__(2);
var processMaster_1 = __webpack_require__(6);
var processWorker_1 = __webpack_require__(7);
var options_1 = __webpack_require__(17);
var ClusterWS = (function () {
    function ClusterWS(configurations) {
        this.configurations = configurations;
        if (ClusterWS._instance)
            return;
        ClusterWS._instance = this;
        this.configurations = this.configurations || {};
        this.options = new options_1.Options(this.configurations);
        if (cluster_1.isMaster) {
            processMaster_1.processMaster(this.options);
        }
        else {
            processWorker_1.processWorker(this.options);
        }
    }
    return ClusterWS;
}());
exports.ClusterWS = ClusterWS;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var cluster_1 = __webpack_require__(2);
var messages_1 = __webpack_require__(0);
function processMaster(options) {
    var broker;
    var workers;
    console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + options.port + ', PID ' + process.pid);
    var launchWorker = function (i) {
        var worker = workers[i] = cluster_1.fork();
        worker.on('exit', function () {
            if (options.restartWorkerOnFail) {
                console.log('\x1b[33m%s\x1b[0m', 'Restarting worker ' + i + ' on fail ');
                launchWorker(i);
            }
        });
        worker.send(messages_1.MessageFactory.processMessages('initWorker', i));
    };
    broker = cluster_1.fork();
    broker.send(messages_1.MessageFactory.processMessages('initBroker'));
    workers = new Array(options.workers);
    for (var i = 0; i < options.workers; i++) {
        launchWorker(i);
    }
}
exports.processMaster = processMaster;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var worker_1 = __webpack_require__(8);
var broker_1 = __webpack_require__(16);
function processWorker(options) {
    var server;
    process.on('message', function (message) {
        switch (message.type) {
            case 'initBroker':
                server = new broker_1.Broker(options);
                server.is = 'Broker';
                break;
            case 'initWorker':
                options.id = message.data;
                server = new worker_1.Worker(options);
                server.is = 'Worker';
                options.worker.call(server);
                break;
            default: break;
        }
    });
    process.on('uncaughtException', function (err) {
        console.log('\x1b[31m%s\x1b[0m', server.is + ', PID ' + process.pid + '\n' + err.stack + '\n');
        process.exit();
    });
}
exports.processWorker = processWorker;


/***/ }),
/* 8 */
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
var WebSocket = __webpack_require__(9);
var socket_1 = __webpack_require__(10);
var tcp_socket_1 = __webpack_require__(3);
var eventEmitter_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(0);
var http_1 = __webpack_require__(15);
var Worker = (function (_super) {
    __extends(Worker, _super);
    function Worker(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        _this.id = _this.options.id;
        Worker._connectBroker(_this);
        Worker._connectHttpServer(_this);
        Worker._connectWebSocketServer(_this);
        return _this;
    }
    Worker._connectBroker = function (self) {
        self.broker = new tcp_socket_1.TcpSocket(self.options.brokerPort, '127.0.0.1');
        self.broker.on('message', function (msg) {
            if (msg === '_0')
                return self.broker.send('_1');
            self.emit('publish', JSON.parse(msg));
        });
        self.broker.on('disconnect', function () {
            console.log('\x1b[31m%s\x1b[0m', 'Broker has been disconnected');
        });
        self.broker.on('error', function (err) {
            console.log('\x1b[31m%s\x1b[0m', 'Worker' + ', PID ' + process.pid + '\n' + err.stack + '\n');
        });
    };
    Worker._connectHttpServer = function (self) {
        self.httpServer = http_1.createServer();
        self.httpServer.listen(self.options.port, function () {
            console.log('\x1b[36m%s\x1b[0m', '          Worker: ' + self.options.id + ', PID ' + process.pid);
        });
    };
    Worker._connectWebSocketServer = function (self) {
        var webSocketServer = new WebSocket.Server({ server: self.httpServer });
        webSocketServer.on('connection', function (_socket) {
            var socket = new socket_1.Socket(_socket, self);
            self.emit('connection', socket);
        });
        self.webSocketServer = webSocketServer;
        self.webSocketServer.on = function (event, fn) {
            self.on(event, fn);
        };
        self.webSocketServer.publish = function (channel, data) {
            self.broker.send(messages_1.MessageFactory.brokerMessage(channel, data));
            self.emit('publish', { channel: channel, data: data });
        };
    };
    return Worker;
}(eventEmitter_1.EventEmitter));
exports.Worker = Worker;


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("uws");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var eventEmitter_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(0);
var socketPing_1 = __webpack_require__(11);
var socketMessage_1 = __webpack_require__(12);
var socketClose_1 = __webpack_require__(13);
var socketError_1 = __webpack_require__(14);
var Socket = (function () {
    function Socket(_socket, server) {
        var _this = this;
        this._socket = _socket;
        this.server = server;
        this.missedPing = 0;
        this.eventsEmitter = new eventEmitter_1.EventEmitter();
        this.channelsEmitter = new eventEmitter_1.EventEmitter();
        this.publishListener = function (msg) {
            _this.channelsEmitter.emit(msg.channel, msg.data);
        };
        this.server.on('publish', this.publishListener);
        socketPing_1.socketPing(this);
        socketMessage_1.socketMessage(this);
        socketError_1.socketError(this);
        socketClose_1.socketClose(this);
    }
    Socket.prototype.on = function (event, fn) {
        if (!this.eventsEmitter.exist(event))
            this.eventsEmitter.on(event, fn);
    };
    Socket.prototype.send = function (event, data, type) {
        switch (type) {
            case 'ping':
                this._socket.send(event);
                break;
            case 'internal':
                this._socket.send(messages_1.MessageFactory.internalMessage(event, data));
                break;
            case 'publish':
                this._socket.send(messages_1.MessageFactory.publishMessage(event, data));
                break;
            default:
                this._socket.send(messages_1.MessageFactory.emitMessage(event, data));
                break;
        }
    };
    Socket.prototype.disconnect = function (code, message) {
        return this._socket.close(code, message);
    };
    return Socket;
}());
exports.Socket = Socket;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function socketPing(self) {
    self.send('config', { pingInterval: self.server.options.pingInterval }, 'internal');
    self.pingPongInterval = setInterval(function () {
        if (self.missedPing >= 2) {
            return self.disconnect(3001, 'No pongs');
        }
        self.send('_0', null, 'ping');
        self.missedPing++;
    }, self.server.options.pingInterval);
}
exports.socketPing = socketPing;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function socketMessage(self) {
    self._socket.on('message', function (msg) {
        if (msg === '_1') {
            return self.missedPing = 0;
        }
        try {
            msg = JSON.parse(msg);
        }
        catch (e) {
            return self.disconnect(1007);
        }
        switch (msg.action) {
            case 'emit':
                self.eventsEmitter.emit(msg.event, msg.data);
                break;
            case 'publish':
                if (self.channelsEmitter.exist(msg.channel))
                    self.server.webSocketServer.publish(msg.channel, msg.data);
                break;
            case 'internal':
                if (msg.event === 'subscribe') {
                    self.channelsEmitter.on(msg.data, function (data) {
                        self.send(msg.data, data, 'publish');
                    });
                }
                if (msg.event === 'unsubscribe') {
                    self.channelsEmitter.removeEvent(msg.data);
                }
                break;
            default: break;
        }
    });
}
exports.socketMessage = socketMessage;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function socketClose(self) {
    self._socket.on('close', function (code, msg) {
        self.eventsEmitter.emit('disconnect', code, msg);
        clearInterval(self.pingPongInterval);
        self.server.removeListener('publish', self.publishListener);
        self.eventsEmitter.removeAllEvents();
        self.channelsEmitter.removeAllEvents();
        for (var key in self) {
            if (self.hasOwnProperty(key)) {
                self[key] = null;
                delete self[key];
            }
        }
    });
}
exports.socketClose = socketClose;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function socketError(self) {
    self._socket.on('error', function (err) {
        self.eventsEmitter.emit('error', err);
    });
}
exports.socketError = socketError;


/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tcp_socket_1 = __webpack_require__(3);
var net_1 = __webpack_require__(4);
var Broker = (function () {
    function Broker(options) {
        var _this = this;
        this.options = options;
        this.servers = [];
        console.log('\x1b[36m%s\x1b[0m', '>>> Broker on: ' + this.options.brokerPort + ', PID ' + process.pid);
        this.brokerServer = net_1.createServer(function (socket) {
            socket = new tcp_socket_1.TcpSocket(socket);
            var length = _this.servers.length;
            socket.id = length;
            socket.pingInterval = setInterval(function () {
                socket.send('_0');
            }, 20000);
            _this.servers[length] = socket;
            socket.on('message', function (msg) {
                if (msg === '_1')
                    return;
                _this.broadcast(socket.id, msg);
            });
            socket.on('disconnect', function () {
                console.log('socket disconnected');
            });
            socket.on('error', function (err) {
                console.error('\x1b[31m%s\x1b[0m', 'Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n');
            });
        });
        this.brokerServer.listen(this.options.brokerPort);
    }
    Broker.prototype.broadcast = function (id, msg) {
        for (var i = 0, len = this.servers.length; i < len; i++) {
            if (id !== i)
                this.servers[i].send(msg);
        }
    };
    return Broker;
}());
exports.Broker = Broker;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Options = (function () {
    function Options(configurations) {
        if (!configurations.worker) {
            throw '\n\x1b[31mWorker function must be provided\x1b[0m';
        }
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


/***/ })
/******/ ]);