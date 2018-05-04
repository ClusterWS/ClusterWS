// tslint:disable-next-line
export const noop: any = (): void => { }

export const OPCODE_TEXT: number = 1
export const OPCODE_PING: number = 9
export const OPCODE_BINARY: number = 2
export const APP_PONG_CODE: number = 65
export const APP_PING_CODE: any = Buffer.from('9')
export const PERMESSAGE_DEFLATE: number = 1
export const DEFAULT_PAYLOAD_LIMIT: number = 16777216

export const native: any = ((): void => {
  try {
    return require(`${require.resolve('uws').replace('uws.js', '')}uws_${process.platform}_${process.versions.modules}`)
  } catch (e) {
    const version: number[] = process.version.substring(1).split('.').map((n: any) => parseInt(n, 10))
    const lessThanSixFour: boolean = version[0] < 6 || (version[0] === 6 && version[1] < 4)

    if (process.platform === 'win32' && lessThanSixFour)
      throw new Error('µWebSockets requires Node.js 8.0.0 or greater on Windows.')
    throw new Error('Could not run µWebSockets bindings')
  }
})()