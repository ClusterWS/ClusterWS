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

function BrokerServer(e, r, n) {
    var t = [];
    new WebSocket.Server({
        port: e
    }, function() {
        return process.send({
            event: "READY",
            pid: process.pid
        });
    }).on("connection", function(e) {
        var n = !1, o = setInterval(function() {
            return e.send("#0");
        }, 2e4), s = setTimeout(function() {
            return e.close(4e3, "Not Authenticated");
        }, 5e3);
        e.on("message", function(o) {
            if ("#1" !== o) {
                if (o === r) {
                    if (n) return;
                    return n = !0, function e(r) {
                        r.id = generateKey(16);
                        for (var n = 0, o = t.length; n < o; n++) if (t[n].id === r.id) return e(r);
                        t.push(r);
                    }(e), clearTimeout(s);
                }
                n && function(e, r) {
                    for (var n = 0, o = t.length; n < o; n++) t[n].id !== e && t[n].send(r);
                }(e.id, o);
            }
        }), e.on("close", function(r, i) {
            if (clearTimeout(s), clearInterval(o), n) for (var c = 0, u = t.length; c < u; c++) if (t[c].id === e.id) return t.splice(c, 1);
            e = null;
        });
    });
}

function BrokerClient(e, r, n, t) {
    var o = new WebSocket(e);
    o.on("open", function() {
        n.setBroker(o, e), t && logReady("Broker's socket has been reconnected"), o.send(r);
    }), o.on("error", function(t) {
        if ("uWs client connection error" === t.stack) return o = null, setTimeout(function() {
            return BrokerClient(e, r, n, !0);
        }, 20);
        logError("Socket " + process.pid + " has an issue: \n" + t.stack + "\n");
    }), o.on("close", function(t, s) {
        return 4e3 === t ? logError("Wrong authorization key") : (logWarning("Something went wrong, socket will be reconnected as soon as possible"), 
        o = null, setTimeout(function() {
            return BrokerClient(e, r, n, !0);
        }, 20));
    }), o.on("message", function(e) {
        return "#0" === e ? o.send("#1") : n.broadcastMessage("", e);
    });
}

var extendStatics = Object.setPrototypeOf || {
    __proto__: []
} instanceof Array && function(e, r) {
    e.__proto__ = r;
} || function(e, r) {
    for (var n in r) r.hasOwnProperty(n) && (e[n] = r[n]);
};

function __extends(e, r) {
    function n() {
        this.constructor = e;
    }
    extendStatics(e, r), e.prototype = null === r ? Object.create(r) : (n.prototype = r.prototype, 
    new n());
}

var EventEmitter = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.on = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] = r;
    }, e.prototype.emit = function(e) {
        for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
        var t = this.events[e];
        t && t.call.apply(t, [ null ].concat(r));
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
        for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
        var t, o = this.events[e];
        if (o) for (var s = 0, i = o.length; s < i; s++) (t = o[s]).call.apply(t, [ null, e ].concat(r));
    }, e.prototype.removeListener = function(e, r) {
        var n = this.events[e];
        if (n) {
            for (var t = 0, o = n.length; t < o; t++) if (n[t] === r) return n.splice(t, 1);
            0 === n.length && (this.events[e] = null);
        }
    }, e.prototype.exist = function(e) {
        return this.events[e] && this.events[e].length > 0;
    }, e;
}(), WSServer = function(e) {
    function r() {
        var r = null !== e && e.apply(this, arguments) || this;
        return r.channels = new EventEmitterMany(), r.middleware = {}, r.brokers = {}, r.nextBroker = 0, 
        r;
    }
    return __extends(r, e), r.prototype.setMiddleware = function(e, r) {
        this.middleware[e] = r;
    }, r.prototype.sendToWorkers = function(e) {
        var r = Object.keys(this.brokers);
        this.brokers[r[this.nextBroker]].send(Buffer.from("sendToWorkers%" + JSON.stringify({
            message: e
        }))), this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, e), 
        this.nextBroker >= r.length - 1 ? this.nextBroker = 0 : this.nextBroker++;
    }, r.prototype.publish = function(e, r) {
        if ("sendToWorkers" !== e) {
            var n = Object.keys(this.brokers);
            this.brokers[n[this.nextBroker]].send(Buffer.from(e + "%" + JSON.stringify({
                message: r
            }))), this.channels.emitmany(e, r), this.nextBroker >= n.length - 1 ? this.nextBroker = 0 : this.nextBroker++;
        }
    }, r.prototype.broadcastMessage = function(e, r) {
        var n = (r = Buffer.from(r)).indexOf(37), t = r.slice(0, n).toString();
        if ("sendToWorkers" === t) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, JSON.parse(r.slice(n + 1).message));
        if (this.channels.exist(t)) {
            var o = JSON.parse(r.slice(n + 1)).message;
            return this.channels.emitmany(t, o);
        }
    }, r.prototype.setBroker = function(e, r) {
        this.brokers[r] = e;
    }, r;
}(EventEmitter);

function encode(e, r, n) {
    switch (n) {
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
            var n = function() {
                e.channels[r["#"][2]] = 1, e.worker.wss.channels.onmany(r["#"][2], e.onPublish);
            };
            return e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe.call(null, e, r["#"][2], function(e) {
                return e && n();
            }) : n();

          case "u":
            return e.worker.wss.channels.removeListener(r["#"][2], e.onPublish), e.channels[r["#"][2]] = null;
        }
    }
}

var Socket = function() {
    function e(e, r) {
        var n = this;
        this.worker = e, this.socket = r, this.events = new EventEmitter(), this.channels = {}, 
        this.missedPing = 0, this.onPublish = function(e, r) {
            return n.send(e, r, "publish");
        };
        var t = setInterval(function() {
            return n.missedPing++ > 2 ? n.disconnect(4001, "No pongs") : n.send("#0", null, "ping");
        }, this.worker.options.pingInterval);
        this.send("configuration", {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        }, "system"), this.socket.on("error", function(e) {
            return n.events.emit("error", e);
        }), this.socket.on("close", function(e, r) {
            clearInterval(t), n.events.emit("disconnect", e, r);
            for (var o in n.channels) n.channels[o] && n.worker.wss.channels.removeListener(o, n.onPublish);
            for (var o in n) n[o] && (n[o] = null);
        }), this.socket.on("message", function(e) {
            if ("string" != typeof e && (e = Buffer.from(e).toString()), "#1" === e) return n.missedPing = 0;
            try {
                e = JSON.parse(e);
            } catch (e) {
                return logError("PID: " + process.pid + "\n" + e + "\n");
            }
            decode(n, e);
        });
    }
    return e.prototype.on = function(e, r) {
        this.events.on(e, r);
    }, e.prototype.send = function(e, r, n) {
        void 0 === n && (n = "emit"), this.socket.send(this.worker.options.useBinary ? Buffer.from(encode(e, r, n)) : encode(e, r, n));
    }, e.prototype.disconnect = function(e, r) {
        this.socket.close(e, r);
    }, e;
}(), Worker = function() {
    return function(e, r) {
        var n = this;
        this.options = e, this.wss = new WSServer();
        for (var t = 0; t < e.brokers; t++) BrokerClient("ws://127.0.0.1:" + this.options.brokersPorts[t], r, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer(), 
        new WebSocket.Server({
            server: this.server,
            verifyClient: function(e, r) {
                return n.wss.middleware.verifyConnection ? n.wss.middleware.verifyConnection.call(null, e, r) : r(!0);
            }
        }).on("connection", function(e) {
            return n.wss.emit("connection", new Socket(n, e));
        }), this.server.listen(this.options.port, function() {
            n.options.worker.call(n), process.send({
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
        if (!e.brokersPorts) for (var n = 0; n < r.brokers; n++) r.brokersPorts.push(9400 + n);
        if (r.brokersPorts.length < r.brokers) return logError("Number of broker ports is less than number of brokers \n");
        cluster.isMaster ? MasterProcess(r) : WorkerProcess(r);
    };
}();

function MasterProcess(e) {
    var r = !0, n = generateKey(16), t = {}, o = {};
    if (e.horizontalScaleOptions) i("Scaler", -1); else for (var s = 0; s < e.brokers; s++) i("Broker", s);
    function i(s, c) {
        var u = cluster.fork();
        u.on("message", function(n) {
            return "READY" === n.event && function(n, s, c) {
                if (!r) return logReady(n + " PID " + c + " has restarted");
                "Worker" === n && (o[s] = "       Worker: " + s + ", PID " + c);
                if ("Scaler" === n) for (var u = 0; u < e.brokers; u++) i("Broker", u);
                if ("Broker" === n && (t[s] = ">>> Broker on: " + e.brokersPorts[s] + ", PID " + c, 
                Object.keys(t).length === e.brokers)) for (var u = 0; u < e.workers; u++) i("Worker", u);
                if (Object.keys(t).length === e.brokers && Object.keys(o).length === e.workers) {
                    r = !1, logReady(">>> Master on: " + e.port + ", PID: " + process.pid + (e.tlsOptions ? " (secure)" : ""));
                    for (var a in t) t[a] && logReady(t[a]);
                    for (var a in o) o[a] && logReady(o[a]);
                }
            }(s, c, n.pid);
        }), u.on("exit", function() {
            logError(s + " has been disconnected \n"), e.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
            i(s, c)), u = null;
        }), u.send({
            key: n,
            processID: c,
            processName: s
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
        }
    }), process.on("uncaughtException", function(e) {
        return logError("PID: " + process.pid + "\n" + e.stack + "\n"), process.exit();
    });
}

module.exports = ClusterWS, module.exports.default = ClusterWS;
