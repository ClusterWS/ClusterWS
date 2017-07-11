"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var messages_1 = require("./lib/modules/messages/messages");
var options_1 = require("./lib/options");
var ClusterWS = (function () {
    function ClusterWS(configurations) {
        this.configurations = configurations;
        this.configurations = this.configurations || {};
        this.options = new options_1.Options(configurations);
        this.servers = child_process_1.fork(__dirname + '/lib/servers');
        this.servers.send(messages_1.MessageFactory.processMessages('init', this.options));
    }
    return ClusterWS;
}());
exports.ClusterWS = ClusterWS;
