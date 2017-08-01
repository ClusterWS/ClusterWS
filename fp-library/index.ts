import * as _ from './utils/fp'
import * as cluster from 'cluster'
import { log } from './utils/common'
import { processWorker } from './lib/processWorker'
import { processMaster } from './lib/processMaster'
import { Options, loadOptions } from './lib/options'

let runProcess: any = (options: Options) => cluster.isMaster ?
    processMaster(options, cluster) :
    processWorker(options)

module.exports = _.compose(_.either(log, runProcess), loadOptions)
