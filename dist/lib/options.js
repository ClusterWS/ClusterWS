"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var Options = (function () {
    function Options(configurations) {
        if (!configurations.pathToWorker) {
            throw new Error('\x1b[31mPath to the worker must be provided\x1b[0m');
        }
        this.port = configurations.port || 3000;
        this.workers = configurations.workers || 1;
        this.brokerPort = configurations.brokerPort || 9346;
        this.pathToWorker = path_1.resolve(configurations.pathToWorker);
        this.pingPongInterval = configurations.pingPongInterval || 20000;
        this.restartWorkerOnFail = configurations.restartWorkerOnFail || false;
    }
    return Options;
}());
exports.Options = Options;
