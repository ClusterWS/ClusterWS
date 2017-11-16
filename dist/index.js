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
}([ function(r, e) {
    r.exports = require("cluster");
}, function(r, e, n) {
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
}, function(r, e, n) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var t = n(0), o = n(1), i = n(3), s = function() {
        function r(r) {
            if (!r.worker || "[object Function]" !== {}.toString.call(r.worker)) return o.logError("Worker must be provided and it must be a function \n \n");
            var e = {
                port: r.port || 80,
                worker: r.worker,
                workers: r.workers || 1,
                brokerPort: r.brokerPort || 9346,
                pingInterval: r.pingInterval || 2e4,
                restartOnFail: r.restartOnFail || !1
            };
            t.isMaster && i.masterProcess(e);
        }
        return r;
    }();
    e.ClusterWS = s;
}, function(r, e, n) {
    "use strict";
    function t(r) {
        function e(t, s) {
            var a = o.fork();
            a.on("exit", function() {
                i.logWarning(t + " has been disconnected \n"), r.restartOnFail && (i.logWarning(t + " is restarting \n"), 
                e(t, s));
            }), a.on("message", function(r) {
                return "Ready" === r.event ? n(s, r.data, t) : "";
            }), a.send({
                name: t,
                data: {
                    internalKey: u,
                    index: s
                }
            });
        }
        function n(n, o, u) {
            if (t) return s[n] = "       " + u + ": " + n + ", PID: " + o, i.logReady(u + " has been restarted");
            if (0 === n) {
                for (var a = 1; a <= r.workers; a++) e("Worker", a);
                return s[n] = ">>> " + u + " on: " + r.brokerPort + ", PID " + o;
            }
            if (Object.keys(s).length === r.workers) {
                t = !0, i.logReady(">>> Master on: " + r.port + ", PID: " + process.pid);
                for (var c in s) s[c] && i.logReady(s[c]);
            }
        }
        var t = !1, s = {}, u = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        e("Broker", 0);
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = n(0), i = n(1);
    e.masterProcess = t;
} ]);