module.exports = function(r) {
    function e(o) {
        if (t[o]) return t[o].exports;
        var n = t[o] = {
            i: o,
            l: !1,
            exports: {}
        };
        return r[o].call(n.exports, n, n.exports, e), n.l = !0, n.exports;
    }
    var t = {};
    return e.m = r, e.c = t, e.d = function(r, t, o) {
        e.o(r, t) || Object.defineProperty(r, t, {
            configurable: !1,
            enumerable: !0,
            get: o
        });
    }, e.n = function(r) {
        var t = r && r.__esModule ? function() {
            return r.default;
        } : function() {
            return r;
        };
        return e.d(t, "a", t), t;
    }, e.o = function(r, e) {
        return Object.prototype.hasOwnProperty.call(r, e);
    }, e.p = "", e(e.s = 0);
}([ function(r, e, t) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = t(1), n = function() {
        function r(r) {
            var e = {
                port: r.port || 80,
                worker: r.worker,
                workers: r.workers || 1,
                brokerPort: r.brokerPort || 9346,
                pingInterval: r.pingInterval || 2e4,
                restartOnFail: r.restartOnFail || !1
            };
            o.processMaster(e);
        }
        return r;
    }();
    e.ClusteWS = n;
}, function(r, e, t) {
    "use strict";
    function o(r) {
        var e = 0, t = [], o = function(o, s) {
            if (t[o] = 0 === o ? ">>> Broker on: " + r.brokerPort + ", PID " + s : "       Worker: " + o + ", PID " + s, 
            e++ >= r.workers) {
                n.logReady(">>> Master on: " + r.port + ", PID " + process.pid);
                for (var u in t) n.logReady(t[u]);
            }
        }, i = function(e, t) {
            var n = u.fork();
            n.on("message", function(r) {
                return "ready" === r.event ? o(t, r.data) : "";
            }), n.on("exit", function() {
                return r.restartOnFail ? i(e, t) : "";
            }), n.send(s.processMessage(e, t));
        };
        i("initBroker", 0);
        for (var c = 1; c <= r.workers; c++) i("initWorker", c);
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var n = t(2), s = t(3), u = t(4);
    e.processMaster = o;
}, function(r, e, t) {
    "use strict";
    function o(r) {
        console.log("[36m%s[0m", r);
    }
    function n(r) {
        console.log("[31m%s[0m", r);
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.logReady = o, e.logError = n;
}, function(r, e, t) {
    "use strict";
    function o(r, e) {
        return {
            event: r,
            data: e
        };
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.processMessage = o;
}, function(r, e) {
    r.exports = require("cluster");
} ]);