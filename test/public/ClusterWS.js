(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
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
var MessageFactory = (function () {
    function MessageFactory() {
    }
    MessageFactory.emitMessage = function (event, data) {
        return JSON.stringify(new EmitMessage(event, data));
    };
    MessageFactory.publishMessage = function (channel, data) {
        return JSON.stringify(new PublishMessage(channel, data));
    };
    MessageFactory.internalMessage = function (event, data) {
        return JSON.stringify(new InternalMessage(event, data));
    };
    return MessageFactory;
}());
exports.MessageFactory = MessageFactory;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var channel_1 = __webpack_require__(2);
var messages_1 = __webpack_require__(0);
var Options = (function () {
    function Options(url, port) {
        if (!url) {
            throw new Error('Url must be provided');
        }
        if (!port) {
            throw new Error('Port must be provided');
        }
        this.url = url;
        this.port = port;
    }
    return Options;
}());
var ClusterWS = (function () {
    function ClusterWS(configurations) {
        var _this = this;
        this.configurations = configurations;
        this.pingPong = 0;
        this.events = {};
        this.channels = {};
        configurations = configurations || {};
        this.options = new Options(configurations.url, configurations.port);
        this.webSocket = new WebSocket('ws://' + this.options.url + ':' + this.options.port);
        this.webSocket.onopen = function (msg) {
            return _this._execEventFn('connect', msg);
        };
        this.webSocket.onclose = function (code, msg) {
            _this._execEventFn('disconnect', code, msg);
            clearInterval(_this.pingTimeOut);
            for (var key in _this.channels) {
                if (_this.channels.hasOwnProperty(key)) {
                    _this.channels[key] = null;
                    delete _this.channels[key];
                }
            }
            for (var key in _this.events) {
                if (_this.events.hasOwnProperty(key)) {
                    _this.events[key] = null;
                    delete _this.events[key];
                }
            }
            for (var key in _this) {
                if (_this.hasOwnProperty(key)) {
                    _this[key] = null;
                    delete _this[key];
                }
            }
            return;
        };
        this.webSocket.onerror = function (msg) {
            return _this._execEventFn('error', msg);
        };
        this.webSocket.onmessage = function (msg) {
            if (msg.data === '_0') {
                _this.pingPong = 0;
                return _this.webSocket.send('_1');
            }
            msg = JSON.parse(msg.data);
            if (msg.action === 'emit') {
                return _this._execEventFn(msg.event, msg.data);
            }
            if (msg.action === 'publish') {
                return _this._execChannelFn(msg.channel, msg.data);
            }
            if (msg.action === 'internal') {
                if (msg.event === 'config') {
                    _this.pingTimeOut = setInterval(function () {
                        if (_this.pingPong >= 2) {
                            return _this.disconnect(3001, 'Did not get ping');
                        }
                        return _this.pingPong++;
                    }, msg.data.pingInterval);
                    return;
                }
            }
            return;
        };
    }
    ClusterWS.prototype._execEventFn = function (event, data, msg) {
        var exFn = this.events[event];
        if (exFn) {
            if (event === 'disconnect')
                return exFn(data, msg);
            return exFn(data);
        }
        return;
    };
    ClusterWS.prototype._execChannelFn = function (channel, data) {
        var exFn = this.channels[channel];
        if (exFn)
            exFn(data);
        return;
    };
    ClusterWS.prototype.on = function (event, fn) {
        if (this.events[event])
            this.events[event] = null;
        return this.events[event] = fn;
    };
    ClusterWS.prototype.send = function (event, data) {
        return this.webSocket.send(messages_1.MessageFactory.emitMessage(event, data));
    };
    ClusterWS.prototype.disconnect = function (code, message) {
        this.webSocket.close(code, message);
    };
    ClusterWS.prototype.subscribe = function (channel) {
        return new channel_1.Channel(channel, this);
    };
    return ClusterWS;
}());
exports.ClusterWS = ClusterWS;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = __webpack_require__(0);
var Channel = (function () {
    function Channel(channel, client) {
        this.channel = channel;
        this.client = client;
        this.client.webSocket.send(messages_1.MessageFactory.internalMessage('subscribe', this.channel));
    }
    Channel.prototype.watch = function (fn) {
        this.client.channels[this.channel] = fn;
        return this;
    };
    Channel.prototype.publish = function (data) {
        this.client.webSocket.send(messages_1.MessageFactory.publishMessage(this.channel, data));
        return this;
    };
    return Channel;
}());
exports.Channel = Channel;


/***/ })
/******/ ]);
});