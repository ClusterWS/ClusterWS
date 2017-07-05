"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var messages_1 = require("./lib/messages/messages");
var options_1 = require("./lib/options");
var ClusterWS = (function () {
    function ClusterWS(configuration) {
        this.configuration = configuration;
        this.configuration = this.configuration || {};
        var servers = child_process_1.fork(__dirname + '/lib/servers');
        servers.send(new messages_1.ProcessMessages('init', new options_1.Options(this.configuration.port, this.configuration.workers, this.configuration.workerPath, this.configuration.restartWorkerOnFail, this.configuration.brokerPort)));
    }
    return ClusterWS;
}());
exports.ClusterWS = ClusterWS;
