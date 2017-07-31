let _ = require('./utils/fp')
let log = require('./utils/fp').log
let processWorker = require('./lib/processWorker')

import * as cluster from 'cluster'
import { processMaster } from './lib/processMaster'
import { Options, loadOptions } from './lib/options'

let runProcess: any = _.curry((options: Options) => cluster.isMaster ?
    processMaster(options, cluster) :
    processWorker(options))

module.exports = _.compose(_.either(log, runProcess), loadOptions)
