import { Options } from '../common/interfaces'


export class Worker {
    httpServer: any;
    socketServer: any;

    constructor(public options: Options, public id: number) {

        this.socketServer = {
            middleware: {},
            emitter: {},
            on: {},
            publish: {}
        }

    }
}