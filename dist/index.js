"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var options_1 = require("./lib/options");
var servers_1 = require("./lib/servers");
var ClusterWS = (function () {
    function ClusterWS(configurations) {
        this.configurations = configurations;
        this.configurations = this.configurations || {};
        this.options = new options_1.Options(configurations);
        this.servers = servers_1.Servers(this.options);
    }
    return ClusterWS;
}());
exports.ClusterWS = ClusterWS;
