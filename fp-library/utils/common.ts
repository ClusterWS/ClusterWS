let _ = require('./fp')

module.exports.on = _.curry((type: any, fn: any) => process.on(type, fn))
module.exports.log = (x: any) => console.log(x)