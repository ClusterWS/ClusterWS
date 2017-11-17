module.exports = function(r) {
    function e(t) {
        if (n[t]) return n[t].exports;
        var o = n[t] = {
            i: t,
            l: !1,
            exports: {}
        };
        return r[t].call(o.exports, o, o.exports, e), o.l = !0, o.exports;
    }
    var n = {};
    return e.m = r, e.c = n, e.d = function(r, n, t) {
        e.o(r, n) || Object.defineProperty(r, n, {
            configurable: !1,
            enumerable: !0,
            get: t
        });
    }, e.n = function(r) {
        var n = r && r.__esModule ? function() {
            return r.default;
        } : function() {
            return r;
        };
        return e.d(n, "a", n), n;
    }, e.o = function(r, e) {
        return Object.prototype.hasOwnProperty.call(r, e);
    }, e.p = "", e(e.s = 2);
}([ function(r, e, n) {
    "use strict";
    function t(r) {
        return console.log("[31m%s[0m", r);
    }
    function o(r) {
        return console.log("[36m%s[0m", r);
    }
    function i(r) {
        return console.log("[33m%s[0m", r);
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.logError = t, e.logReady = o, e.logWarning = i;
}, function(r, e) {
    r.exports = require("cluster");
}, function(r, e, n) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var t = n(1), o = n(0), i = n(3), s = n(4), u = function() {
        function r(r) {
            if (!r.worker || "[object Function]" !== {}.toString.call(r.worker)) return o.logError("Worker must be provided and it must be a function \n \n");
            var e = {
                port: r.port || 80,
                worker: r.worker,
                workers: r.workers || 1,
                brokerPort: r.brokerPort || 9346,
                pingInterval: r.pingInterval || 2e4,
                restartWorkerOnFail: r.restartWorkerOnFail || !1
            };
            t.isMaster ? i.masterProcess(e) : s.workerProcess(e);
        }
        return r;
    }();
    e.ClusterWS = u;
}, function(r, e, n) {
    "use strict";
    function t(r) {
        function e(t, s) {
            var c = o.fork();
            c.on("exit", function() {
                i.logWarning(t + " has been disconnected \n"), r.restartWorkerOnFail && (i.logWarning(t + " is restarting \n"), 
                e(t, s));
            }), c.on("message", function(r) {
                return "Ready" === r.event ? n(s, r.data, t) : "";
            }), c.send({
                event: t,
                data: {
                    internalKey: u,
                    index: s
                }
            });
        }
        function n(n, o, u) {
            if (t) return i.logReady(u + " has been restarted");
            if (0 === n) {
                for (var c = 1; c <= r.workers; c++) e("Worker", c);
                return s[n] = ">>> " + u + " on: " + r.brokerPort + ", PID " + o;
            }
            if (s[n] = "       " + u + ": " + n + ", PID " + o, Object.keys(s).length === r.workers + 1) {
                t = !0, i.logReady(">>> Master on: " + r.port + ", PID: " + process.pid);
                for (var a in s) s[a] && i.logReady(s[a]);
            }
        }
        var t = !1, s = {}, u = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        e("Broker", 0);
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = n(1), i = n(0);
    e.masterProcess = t;
}, function(r, e, n) {
    "use strict";
    function t(r) {
        process.on("message", function(e) {
            switch (e.event) {
              case "Broker":
                return i.Broker.server(r, e.data);

              case "Worker":
                return;
            }
        }), process.on("uncaughtException", function(e) {
            if (o.logError("PID: " + process.pid + "\n" + e.stack + "\n"), r.restartWorkerOnFail) return process.exit();
        });
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = n(0), i = n(5);
    e.workerProcess = t;
}, function(r, e, n) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var t = n(6), o = n(0), i = function() {
        function r() {}
        return r.server = function(r, e) {
            function n(r) {
                if (r.id = Math.floor(1e5 + 99999999 * Math.random()), 0 === i.length) return i.push(r);
                for (var e = 0, t = i.length; e < t; e++) {
                    if (i[e].id === r.id) return n(r);
                    if (e === t - 1) return i.push(r);
                }
            }
            var i = [], s = new t.Server({
                port: r.brokerPort
            });
            s.on("connection", function(r) {
                var t = setTimeout(function() {
                    return r.close(4e3, "Not Authenticated");
                }, 5e3);
                r.on("message", function(o) {
                    if ("#1" !== o) return o === e.internalKey ? (n(r), clearTimeout(t)) : void 0;
                }), r.on("close", function() {
                    if (r.id) for (var e = 0, n = i.length; e < n; e++) if (i[e].id === r.id) return i.splice(e, 1);
                });
            }), s.on("error", function(r) {
                return o.logError("Broker" + process.pid + " has an issue: \n" + r.stack + "\n");
            });
        }, r;
    }();
    e.Broker = i;
}, function(r, e) {
    r.exports = require("uws");
} ]);