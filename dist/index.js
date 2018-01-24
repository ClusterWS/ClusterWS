"use strict";

var cluster = require("cluster"), HTTP = require("http"), HTTPS = require("https"), WebSocket = require("uws"), crypto = require("crypto");

function logError(e) {
    return console.log("[31m%s[0m", e);
}

function logReady(e) {
    return console.log("[36m%s[0m", e);
}

function logWarning(e) {
    return console.log("[33m%s[0m", e);
}

function generateKey(e) {
    return crypto.randomBytes(Math.ceil(e / 2)).toString("hex").slice(0, e);
}

function BrokerServer(e, r, t, n) {
    var s, o = 0, i = [], c = 0, a = [], l = {};
    if ("Scaler" === n && t && t.masterTlsOptions) {
        var u = HTTPS.createServer(t.masterTlsOptions);
        s = new WebSocket.Server({
            server: u
        }), u.listen(e, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else s = new WebSocket.Server({
        port: e
    }, function() {
        return process.send({
            event: "READY",
            pid: process.pid
        });
    });
    function h(e, r) {
        for (var t = 0, n = a.length; t < n; t++) a[t].id !== e && a[t].send(r);
    }
    s.on("connection", function(e) {
        var s = !1, u = setInterval(function() {
            return e.send("#0");
        }, 2e4), f = setTimeout(function() {
            return e.close(4e3, "Not Authenticated");
        }, 5e3);
        e.on("message", function(u) {
            if ("#1" !== u) {
                if (u === r) {
                    if (s) return;
                    return s = !0, function e(r) {
                        r.id = generateKey(16);
                        for (var t = 0, n = a.length; t < n; t++) if (a[t].id === r.id) return e(r);
                        a.push(r);
                    }(e), clearTimeout(f);
                }
                s && (h(e.id, u), "Scaler" !== n && t && function e(r, t) {
                    void 0 === t && (t = 0);
                    if (0 === c) return setTimeout(function() {
                        return e(r);
                    }, 20);
                    if (1 !== l[i[o]].readyState) return t++ > c ? logError("Does not have access to any global Broker") : (o >= c - 1 ? o = 0 : o++, 
                    e(r, t));
                    l[i[o]].send(r);
                    o >= c - 1 ? o = 0 : o++;
                }(u));
            }
        }), e.on("close", function(r, t) {
            if (clearTimeout(f), clearInterval(u), s) for (var n = 0, o = a.length; n < o; n++) if (a[n].id === e.id) return a.splice(n, 1);
            e = null;
        });
    }), function() {
        if ("Scaler" !== n && t) {
            t.masterPort && BrokerClient((t.masterTlsOptions ? "wss" : "ws") + "://127.0.0.1:" + t.masterPort, t.key || "", {
                broadcastMessage: h,
                setBroker: function(e, r) {
                    l[r] = e, i = Object.keys(l), c = i.length;
                }
            }, !0);
            for (var e = 0, r = t.mastersUrls.length; e < r; e++) BrokerClient(t.mastersUrls[e], t.key || "", {
                broadcastMessage: h,
                setBroker: function(e, r) {
                    l[r] = e, i = Object.keys(l), c = i.length;
                }
            }, !0);
        }
    }();
}

function BrokerClient(e, r, t, n) {
    var s = new WebSocket(e);
    s.on("open", function() {
        t.setBroker(s, e), n && logReady("Broker's socket has been connected to " + e), 
        s.send(r);
    }), s.on("error", function(n) {
        if ("uWs client connection error" === n.stack) return s = null, setTimeout(function() {
            return BrokerClient(e, r, t, !0);
        }, 20);
        logError("Socket " + process.pid + " has an issue: \n" + n.stack + "\n");
    }), s.on("close", function(n, o) {
        return 4e3 === n ? logError("Wrong authorization key") : (logWarning("Something went wrong, socket will be reconnected as soon as possible"), 
        s = null, setTimeout(function() {
            return BrokerClient(e, r, t, !0);
        }, 20));
    }), s.on("message", function(e) {
        return "#0" === e ? s.send("#1") : t.broadcastMessage("", e);
    });
}

var extendStatics = Object.setPrototypeOf || {
    __proto__: []
} instanceof Array && function(e, r) {
    e.__proto__ = r;
} || function(e, r) {
    for (var t in r) r.hasOwnProperty(t) && (e[t] = r[t]);
};

function __extends(e, r) {
    function t() {
        this.constructor = e;
    }
    extendStatics(e, r), e.prototype = null === r ? Object.create(r) : (t.prototype = r.prototype, 
    new t());
}

var EventEmitter = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.on = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] = r;
    }, e.prototype.emit = function(e) {
        for (var r = [], t = 1; t < arguments.length; t++) r[t - 1] = arguments[t];
        var n = this.events[e];
        n && n.call.apply(n, [ null ].concat(r));
    }, e.prototype.removeEvents = function() {
        this.events = {};
    }, e;
}(), EventEmitterMany = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.onmany = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push(r) : this.events[e] = [ r ];
    }, e.prototype.emitmany = function(e) {
        for (var r = [], t = 1; t < arguments.length; t++) r[t - 1] = arguments[t];
        var n, s = this.events[e];
        if (s) for (var o = 0, i = s.length; o < i; o++) (n = s[o]).call.apply(n, [ null, e ].concat(r));
    }, e.prototype.removeListener = function(e, r) {
        var t = this.events[e];
        if (t) {
            for (var n = 0, s = t.length; n < s; n++) if (t[n] === r) return t.splice(n, 1);
            0 === t.length && (this.events[e] = null);
        }
    }, e.prototype.exist = function(e) {
        return this.events[e] && this.events[e].length > 0;
    }, e;
}(), WSServer = function(e) {
    function r() {
        var r = null !== e && e.apply(this, arguments) || this;
        return r.channels = new EventEmitterMany(), r.middleware = {}, r.brokers = {}, r.nextBroker = 0, 
        r.brokersKeys = [], r.brokersKeysLength = 0, r;
    }
    return __extends(r, e), r.prototype.setMiddleware = function(e, r) {
        this.middleware[e] = r;
    }, r.prototype.sendToWorkers = function(e, r) {
        var t = this;
        if (void 0 === r && (r = 0), 0 === this.brokersKeysLength) return setTimeout(function() {
            return t.sendToWorkers(e);
        }, 20);
        try {
            this.brokers[this.brokersKeys[this.nextBroker]].send(Buffer.from("sendToWorkers%" + JSON.stringify({
                message: e
            })));
        } catch (t) {
            return r > this.brokersKeysLength ? logError("Does not have access to any Broker") : (logWarning("Could not pass message to the internal Broker \n" + t.stack), 
            this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++, 
            r++, this.sendToWorkers(e, r));
        }
        this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, e), 
        this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++;
    }, r.prototype.publish = function(e, r, t) {
        var n = this;
        if (void 0 === t && (t = 0), "sendToWorkers" !== e) {
            if (0 === this.brokersKeysLength) return setTimeout(function() {
                return n.publish(e, r);
            }, 20);
            if (1 !== this.brokers[this.brokersKeys[this.nextBroker]].readyState) return t++ > this.brokersKeysLength ? logError("Does not have access to any internal Broker") : (this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++, 
            this.publish(e, r, t));
            this.brokers[this.brokersKeys[this.nextBroker]].send(Buffer.from(e + "%" + JSON.stringify({
                message: r
            }))), this.middleware.onPublish && this.middleware.onPublish.call(null, e, r), this.channels.emitmany(e, r), 
            this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++;
        }
    }, r.prototype.broadcastMessage = function(e, r) {
        var t = (r = Buffer.from(r)).indexOf(37), n = r.slice(0, t).toString();
        if ("sendToWorkers" === n) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, JSON.parse(r.slice(t + 1)).message);
        if (this.channels.exist(n)) {
            var s = JSON.parse(r.slice(t + 1)).message;
            return this.middleware.onPublish && this.middleware.onPublish.call(null, n, s), 
            this.channels.emitmany(n, s);
        }
    }, r.prototype.setBroker = function(e, r) {
        this.brokers[r] = e, this.brokersKeys = Object.keys(this.brokers), this.brokersKeysLength = this.brokersKeys.length;
    }, r;
}(EventEmitter);

function encode(e, r, t) {
    switch (t) {
      case "ping":
        return e;

      case "emit":
        return JSON.stringify({
            "#": [ "e", e, r ]
        });

      case "publish":
        return JSON.stringify({
            "#": [ "p", e, r ]
        });

      case "system":
        switch (e) {
          case "subsribe":
            return JSON.stringify({
                "#": [ "s", "s", r ]
            });

          case "unsubscribe":
            return JSON.stringify({
                "#": [ "s", "u", r ]
            });

          case "configuration":
            return JSON.stringify({
                "#": [ "s", "c", r ]
            });
        }
    }
}

function decode(e, r) {
    switch (r["#"][0]) {
      case "e":
        return e.events.emit(r["#"][1], r["#"][2]);

      case "p":
        return e.channels[r["#"][1]] && e.worker.wss.publish(r["#"][1], r["#"][2]);

      case "s":
        switch (r["#"][1]) {
          case "s":
            var t = function() {
                e.channels[r["#"][2]] = 1, e.worker.wss.channels.onmany(r["#"][2], e.onPublish);
            };
            return e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe.call(null, e, r["#"][2], function(e) {
                return e && t();
            }) : t();

          case "u":
            return e.worker.wss.channels.removeListener(r["#"][2], e.onPublish), e.channels[r["#"][2]] = null;
        }
    }
}

var Socket = function() {
    function e(e, r) {
        var t = this;
        this.worker = e, this.socket = r, this.events = new EventEmitter(), this.channels = {}, 
        this.missedPing = 0, this.onPublish = function(e, r) {
            return t.send(e, r, "publish");
        };
        var n = setInterval(function() {
            return t.missedPing++ > 2 ? t.disconnect(4001, "No pongs") : t.send("#0", null, "ping");
        }, this.worker.options.pingInterval);
        this.send("configuration", {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        }, "system"), this.socket.on("error", function(e) {
            return t.events.emit("error", e);
        }), this.socket.on("close", function(e, r) {
            clearInterval(n), t.events.emit("disconnect", e, r);
            for (var s in t.channels) t.channels[s] && t.worker.wss.channels.removeListener(s, t.onPublish);
            for (var s in t) t[s] && (t[s] = null);
        }), this.socket.on("message", function(e) {
            if ("string" != typeof e && (e = Buffer.from(e).toString()), "#1" === e) return t.missedPing = 0;
            try {
                e = JSON.parse(e);
            } catch (e) {
                return logError("PID: " + process.pid + "\n" + e + "\n");
            }
            decode(t, e);
        });
    }
    return e.prototype.on = function(e, r) {
        this.events.on(e, r);
    }, e.prototype.send = function(e, r, t) {
        void 0 === t && (t = "emit"), this.socket.send(this.worker.options.useBinary ? Buffer.from(encode(e, r, t)) : encode(e, r, t));
    }, e.prototype.disconnect = function(e, r) {
        this.socket.close(e, r);
    }, e;
}(), Worker = function() {
    return function(e, r) {
        var t = this;
        this.options = e, this.wss = new WSServer();
        for (var n = 0; n < e.brokers; n++) BrokerClient("ws://127.0.0.1:" + this.options.brokersPorts[n], r, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer(), 
        new WebSocket.Server({
            server: this.server,
            verifyClient: function(e, r) {
                return t.wss.middleware.verifyConnection ? t.wss.middleware.verifyConnection.call(null, e, r) : r(!0);
            }
        }).on("connection", function(e) {
            return t.wss.emit("connection", new Socket(t, e));
        }), this.server.listen(this.options.port, function() {
            t.options.worker.call(t), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    };
}(), ClusterWS = function() {
    return function(e) {
        if ("[object Function]" !== {}.toString.call(e.worker)) return logError("Worker must be provided and it must be a function \n");
        var r = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            worker: e.worker,
            workers: e.workers || 1,
            brokers: e.brokers || 1,
            useBinary: e.useBinary || !1,
            brokersPorts: e.brokersPorts || [],
            tlsOptions: e.tlsOptions || !1,
            pingInterval: e.pingInterval || 2e4,
            restartWorkerOnFail: e.restartWorkerOnFail || !1,
            horizontalScaleOptions: e.horizontalScaleOptions || !1
        };
        if (!e.brokersPorts) for (var t = 0; t < r.brokers; t++) r.brokersPorts.push(9400 + t);
        if (r.brokersPorts.length < r.brokers) return logError("Number of broker ports is less than number of brokers \n");
        cluster.isMaster ? MasterProcess(r) : WorkerProcess(r);
    };
}();

function MasterProcess(e) {
    var r = !0, t = generateKey(16), n = {}, s = {};
    if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterPort) i("Scaler", -1); else for (var o = 0; o < e.brokers; o++) i("Broker", o);
    function i(o, c) {
        var a = cluster.fork();
        a.on("message", function(t) {
            return "READY" === t.event && function(t, o, c) {
                if (!r) return logReady(t + " PID " + c + " has restarted");
                "Worker" === t && (s[o] = "       Worker: " + o + ", PID " + c);
                if ("Scaler" === t) for (var a = 0; a < e.brokers; a++) i("Broker", a);
                if ("Broker" === t && (n[o] = ">>> Broker on: " + e.brokersPorts[o] + ", PID " + c, 
                Object.keys(n).length === e.brokers)) for (var a = 0; a < e.workers; a++) i("Worker", a);
                if (Object.keys(n).length === e.brokers && Object.keys(s).length === e.workers) {
                    r = !1, logReady(">>> Master on: " + e.port + ", PID: " + process.pid + (e.tlsOptions ? " (secure)" : ""));
                    for (var l in n) n[l] && logReady(n[l]);
                    for (var l in s) s[l] && logReady(s[l]);
                }
            }(o, c, t.pid);
        }), a.on("exit", function() {
            logError(o + " has been disconnected \n"), e.restartWorkerOnFail && (logWarning(o + " is restarting \n"), 
            i(o, c)), a = null;
        }), a.send({
            key: t,
            processID: c,
            processName: o
        });
    }
}

function WorkerProcess(e) {
    process.on("message", function(r) {
        switch (r.processName) {
          case "Broker":
            return BrokerServer(e.brokersPorts[r.processID], r.key, e.horizontalScaleOptions);

          case "Worker":
            return new Worker(e, r.key);

          case "Scaler":
            return e.horizontalScaleOptions && BrokerServer(e.horizontalScaleOptions.masterPort, e.horizontalScaleOptions.key || "", e.horizontalScaleOptions, "Scaler");
        }
    }), process.on("uncaughtException", function(e) {
        return logError("PID: " + process.pid + "\n" + e.stack + "\n"), process.exit();
    });
}

module.exports = ClusterWS, module.exports.default = ClusterWS;
