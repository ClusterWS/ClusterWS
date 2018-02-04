import * as HTTP from 'http'
import * as HTTPS from 'https'
import * as WebSocket from 'uws'

import { Options } from '../../utils/interfaces'

export class Worker {
    public server: HTTP.Server | HTTPS.Server

    constructor(public options: Options, key: string) {
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer()

        new WebSocket.Server({

        })
    }
}