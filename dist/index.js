"use strict";

var cluster = require("cluster"), HTTP = require("http"), HTTPS = require("https"), WebSocket = require("uws");

function randomString(e) {
    return void 0 === e && (e = !0), e ? Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function logError(e) {
    return console.log("[31m%s[0m", e);
}

function logReady(e) {
    return console.log("[36m%s[0m", e);
}

function logWarning(e) {
    return console.log("[33m%s[0m", e);
}

function masterProcess(e) {
    var r = !1, n = randomString(), t = {};
    e.machineScale && e.machineScale.master ? o("Scaler", -1) : o("Broker", 0);
    function o(s, i) {
        var c = cluster.fork();
        c.send({
            event: s,
            data: {
                internalKey: n,
                id: i
            }
        }), c.on("message", function(n) {
            return "READY" === n.event ? function(n, s, i) {
                if (r) return logReady(i + " is restarted");
                if (-1 === n) return o("Broker", 0);
                if (0 === n) {
                    for (var c = 1; c <= e.workers; c++) o("Worker", c);
                    return t[n] = ">>> " + i + " on: " + e.brokerPort + ", PID " + s;
                }
                if (t[n] = "       " + i + ": " + n + ", PID " + s, Object.keys(t).length === e.workers + 1) {
                    r = !0, logReady(">>> Master on: " + e.port + ", PID: " + process.pid + (e.secureProtocolOptions ? " (secure)" : ""));
                    for (var a in t) t[a] && logReady(t[a]);
                }
            }(i, n.data, s) : "";
        }), c.on("exit", function() {
            logWarning(s + " has been disconnected \n"), e.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
            o(s, i));
        });
    }
}

var EventEmitter = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.on = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push(r) : this.events[e] = [ r ];
    }, e.prototype.emit = function(e) {
        for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
        var t = this.events[e];
        if (t) {
            for (var o = 0, s = t.length; o < s; o++) (i = t[o]).call.apply(i, [ null ].concat(r));
            var i;
        }
    }, e.prototype.removeListener = function(e, r) {
        var n = this.events[e];
        if (n) for (var t = 0, o = n.length; t < o; t++) if (n[t] === r) return n.splice(t, 1);
    }, e.prototype.removeEvent = function(e) {
        this.events[e] = null;
    }, e.prototype.removeEvents = function() {
        this.events = {};
    }, e;
}(), Socket = function() {
    function e(r, n) {
        var t = this;
        this.socket = r, this.server = n, this.missedPing = 0, this.channels = [], this.events = new EventEmitter();
        var o = function(e) {
            return -1 !== t.channels.indexOf(e.channel) ? t.send(e.channel, e.data, "publish") : null;
        }, s = setInterval(function() {
            return t.missedPing++ > 2 ? t.disconnect(4001, "No pongs") : t.send("#0", null, "ping");
        }, this.server.options.pingInterval);
        this.server.socketServer.on("#publish", o), this.send("configuration", {
            ping: this.server.options.pingInterval,
            binary: this.server.options.useBinary
        }, "system"), this.socket.on("error", function(e) {
            return t.events.emit("error", e);
        }), this.socket.on("close", function(e, r) {
            clearInterval(s), t.events.emit("disconnect", e, r), t.server.socketServer.removeListener("#publish", o);
            for (var n in t) t[n] && (t[n] = null);
        }), this.socket.on("message", function(r) {
            if (t.server.options.useBinary && "string" != typeof r && (r = Buffer.from(r).toString()), 
            "#1" === r) return t.missedPing = 0;
            try {
                r = JSON.parse(r);
            } catch (e) {
                return logError("PID: " + process.pid + "\n" + e + "\n");
            }
            e.decode(t, r);
        });
    }
    return e.decode = function(e, r) {
        switch (r["#"][0]) {
          case "e":
            return e.events.emit(r["#"][1], r["#"][2]);

          case "p":
            return -1 !== e.channels.indexOf(r["#"][1]) ? e.server.socketServer.publish(r["#"][1], r["#"][2]) : null;

          case "s":
            switch (r["#"][1]) {
              case "s":
                var n = function() {
                    return -1 === e.channels.indexOf(r["#"][2]) ? e.channels.push(r["#"][2]) : null;
                };
                return e.server.socketServer.middleware.onsubscribe ? e.server.socketServer.middleware.onsubscribe(e, r["#"][2], function(e) {
                    return e ? n() : null;
                }) : n();

              case "u":
                var t = e.channels.indexOf(r["#"][2]);
                return -1 !== t ? e.channels.splice(t, 1) : null;
            }
        }
    }, e.encode = function(e, r, n) {
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
    }, e.prototype.send = function(r, n, t) {
        void 0 === t && (t = "emit"), this.socket.send(this.server.options.useBinary ? Buffer.from(e.encode(r, n, t)) : e.encode(r, n, t));
    }, e.prototype.on = function(e, r) {
        this.events.on(e, r);
    }, e.prototype.disconnect = function(e, r) {
        this.socket.close(e, r);
    }, e;
}(), Broker = function() {
    function e() {}
    return e.Client = function(r, n, t, o) {
        var s = new WebSocket(r);
        s.on("message", function(e) {
            return "#0" === e ? s.send("#1") : t.broadcastMessage("", e);
        }), s.on("open", function() {
            o && logReady("Socket has been reconnected"), s.send(n);
        }), s.on("error", function(o) {
            if ("uWs client connection error" === o.stack) return e.Client(r, n, t, !0);
            logError("Socket " + process.pid + " has an issue: \n" + o.stack + "\n");
        }), s.on("close", function(o, s) {
            if (4e3 === o) return logError("Wrong authorization key was provided");
            logWarning("Something went wrong, socket will be reconnected as soon as possible"), 
            e.Client(r, n, t, !0);
        }), t.setBroker(s);
    }, e.Server = function(r, n) {
        var t, o = [], s = new WebSocket.Server({
            port: r
        }, function() {
            return process.send({
                event: "READY",
                data: process.pid
            });
        });
        s.on("connection", function(e) {
            var r = !1, s = setTimeout(function() {
                return e.close(4e3, "Not Authenticated");
            }, 5e3), c = setInterval(function() {
                return e.send("#0");
            }, 2e4);
            e.on("message", function(c) {
                if ("#1" !== c) return c === n.key ? (r = !0, function e(r) {
                    r.id = randomString(!1);
                    if (0 === o.length) return o.push(r);
                    for (var n = 0, t = o.length; n < t; n++) if (o[n].id === r.id) return e(r);
                    o.push(r);
                }(e), clearTimeout(s)) : void (r && (i(e.id, c), n.machineScale && t.send(c)));
            }), e.on("close", function() {
                if (clearTimeout(s), clearInterval(c), r) for (var n = 0, t = o.length; n < t; n++) if (o[n].id === e.id) return o.splice(n, 1);
            });
        }), s.on("error", function(e) {
            return logError("Broker " + process.pid + " has an issue: \n" + e.stack + "\n");
        }), function() {
            if (n.machineScale) {
                var r = "ws://" + (n.machineScale.master ? "127.0.0.1:" : n.machineScale.url + ":") + n.machineScale.port;
                e.Client(r, n.machineScale.securityKey || "", {
                    broadcastMessage: i,
                    setBroker: function(e) {
                        return t = e;
                    }
                });
            }
        }();
        function i(e, r) {
            for (var n = 0, t = o.length; n < t; n++) o[n].id !== e && o[n].send(r);
        }
    }, e;
}(), extendStatics = Object.setPrototypeOf || {
    __proto__: []
} instanceof Array && function(e, r) {
    e.__proto__ = r;
} || function(e, r) {
    for (var n in r) r.hasOwnProperty(n) && (e[n] = r[n]);
};

function __extends(e, r) {
    extendStatics(e, r);
    function n() {
        this.constructor = e;
    }
    e.prototype = null === r ? Object.create(r) : (n.prototype = r.prototype, new n());
}

var SocketServer = function(e) {
    __extends(r, e);
    function r() {
        var r = null !== e && e.apply(this, arguments) || this;
        return r.middleware = {}, r;
    }
    return r.prototype.setMiddleware = function(e, r) {
        this.middleware[e] = r;
    }, r.prototype.publish = function(e, r) {
        this.brokerSocket.send(Buffer.from(JSON.stringify({
            channel: e,
            data: r
        }))), this.emit("#publish", {
            channel: e,
            data: r
        });
    }, r.prototype.setBroker = function(e) {
        this.brokerSocket = e;
    }, r.prototype.broadcastMessage = function(e, r) {
        this.emit("#publish", JSON.parse(Buffer.from(r).toString()));
    }, r;
}(EventEmitter), Worker = function() {
    return function(e, r) {
        var n = this;
        this.options = e, this.socketServer = new SocketServer(), Broker.Client("ws://127.0.0.1:" + e.brokerPort, r.internalKey, this.socketServer), 
        this.options.secureProtocolOptions;
        var t = this.options.secureProtocolOptions ? HTTPS.createServer(this.options.secureProtocolOptions) : HTTP.createServer();
        new WebSocket.Server({
            server: t,
            verifyClient: function(e, r) {
                return n.socketServer.middleware.verifyConnection ? n.socketServer.middleware.verifyConnection.call(null, e, r) : r(!0);
            }
        }).on("connection", function(e) {
            return n.socketServer.emit("connection", new Socket(e, n));
        }), t instanceof HTTPS.Server ? this.httpsServer = t : this.httpServer = t, t.listen(this.options.port, function() {
            n.options.worker.call(n), process.send({
                event: "READY",
                data: process.pid
            });
        });
    };
}();

function workerProcess(e) {
    process.on("message", function(r) {
        switch (r.event) {
          case "Worker":
            return new Worker(e, r.data);

          case "Broker":
            return Broker.Server(e.brokerPort, {
                key: r.data.internalKey,
                machineScale: e.machineScale
            });

          case "Scaler":
            return e.machineScale ? Broker.Server(e.machineScale.port, {
                key: e.machineScale.securityKey || ""
            }) : null;
        }
    }), process.on("uncaughtException", function(e) {
        return logError("PID: " + process.pid + "\n" + e.stack + "\n"), process.exit();
    });
}

var ClusterWS = function() {
    return function(e) {
        if ("[object Function]" !== {}.toString.call(e.worker)) return logError("Worker must be provided and it must be a function \n \n");
        var r = {
            port: e.port || (e.secureProtocolOptions ? 443 : 80),
            worker: e.worker,
            workers: e.workers || 1,
            brokerPort: e.brokerPort || 9346,
            pingInterval: e.pingInterval || 2e4,
            restartWorkerOnFail: e.restartWorkerOnFail || !1,
            useBinary: e.useBinary || !1,
            secureProtocolOptions: e.secureProtocolOptions || !1,
            machineScale: e.machineScale || !1
        };
        cluster.isMaster ? masterProcess(r) : workerProcess(r);
    };
}();

module.exports = ClusterWS;
