// tslint:disable-next-line
export const noop: any = (): void => { }
export const native: any = ((): void => {
  try {
    return require(`./node/uws_${process.platform}_${process.versions.modules}`)
  } catch (e) {
    const version: number[] = process.version.substring(1).split('.').map((n: any) => parseInt(n, 10))
    const lessThanSixFour: boolean = version[0] < 6 || (version[0] === 6 && version[1] < 4)

    if (process.platform === 'win32' && lessThanSixFour)
      throw new Error('µWebSockets requires Node.js 6.4.0 or greater on Windows.')
    throw new Error('Could not run µWebSockets bindings')
  }
})()