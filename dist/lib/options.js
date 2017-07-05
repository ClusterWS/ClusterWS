"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var Options = (function () {
    function Options(port, workers, workerPath, restartWorkerOnFail, brokerPort) {
        if (!workerPath) {
            throw new Error('\x1b[31mPath to the worker must be provided\x1b[0m');
        }
        this.port = port || 3000;
        this.workers = workers || 1;
        this.workerPath = path_1.resolve(workerPath);
        this.restartWorkerOnFail = restartWorkerOnFail || false;
        this.id = 0;
        this.brokerPort = brokerPort || 9346;
    }
    return Options;
}());
exports.Options = Options;
