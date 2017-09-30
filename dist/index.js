module.exports = function(e) {
    function r(o) {
        if (t[o]) return t[o].exports;
        var n = t[o] = {
            i: o,
            l: !1,
            exports: {}
        };
        return e[o].call(n.exports, n, n.exports, r), n.l = !0, n.exports;
    }
    var t = {};
    return r.m = e, r.c = t, r.d = function(e, t, o) {
        r.o(e, t) || Object.defineProperty(e, t, {
            configurable: !1,
            enumerable: !0,
            get: o
        });
    }, r.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return r.d(t, "a", t), t;
    }, r.o = function(e, r) {
        return Object.prototype.hasOwnProperty.call(e, r);
    }, r.p = "", r(r.s = 0);
}([ function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(1), n = function() {
        function e(e) {
            var r = {
                port: e.port || 80,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartOnFail: e.restartOnFail || !1
            };
            o.processMaster(r);
        }
        return e;
    }();
    r.ClusteWS = n;
}, function(e, r, t) {
    "use strict";
    function o(e) {
        var r = 0, t = [], o = function(o, s) {
            if (t[o] = 0 === o ? ">>> Broker on: " + e.brokerPort + ", PID " + s : "       Worker: " + o + ", PID " + s, 
            r++ >= e.workers) {
                n.logReady(">>> Master on: " + e.port + ", PID " + process.pid);
                for (var u in t) n.logReady(t[u]);
            }
        }, i = function(r, t) {
            var n = u.fork();
            n.on("message", function(e) {
                return "ready" === e.event ? o(t, e.data) : "";
            }), n.on("exit", function() {
                return e.restartOnFail ? i(r, t) : "";
            }), n.send(s.processMessage(r, t));
        };
        i("initBroker", 0);
        for (var c = 1; c <= e.workers; c++) i("initWorker", c);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(2), s = t(3), u = t(4);
    r.processMaster = o;
}, function(e, r, t) {
    "use strict";
    function o(e) {
        console.log("[36m%s[0m", e);
    }
    function n(e) {
        console.log("[31m%s[0m", e);
    }
    function s(e) {}
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.logReady = o, r.logError = n, r.logDebug = s;
}, function(e, r, t) {
    "use strict";
    function o(e, r) {
        return {
            event: e,
            data: r
        };
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.processMessage = o;
}, function(e, r) {
    e.exports = require("cluster");
} ]);