export type Message = any
export type Listener = (...args: any[]) => void
export type WorkerFunction = () => void

export type CustomObject = {
  [propName: string]: any
}

export type TlsOptions = {
  ca?: string
  pfx?: string
  key?: string
  cert?: string
  passphrase?: string
}

export type HorizontalScaleOptions = {
  masterOptions?: {
    port: number
    tlsOptions?: TlsOptions
  }
  brokersUrls?: string[]
  key?: string
}

export type Configurations = {
  worker: WorkerFunction
  port?: number
  host?: string
  workers?: number
  brokers?: number
  useBinary?: boolean
  brokersPorts?: number[]
  tlsOptions?: TlsOptions
  pingInterval?: number
  restartWorkerOnFail?: boolean
  horizontalScaleOptions?: HorizontalScaleOptions
  encodeDecodeEngine?: EncodeDecodeEngine
}

export type Options = {
  worker: WorkerFunction
  port: number
  host: string
  workers: number
  brokers: number
  useBinary: boolean
  brokersPorts: number[]
  tlsOptions: TlsOptions | false
  pingInterval: number
  restartWorkerOnFail: boolean
  horizontalScaleOptions: HorizontalScaleOptions | false
  encodeDecodeEngine: EncodeDecodeEngine | false
}

export type EncodeDecodeEngine = {
  encode: (message: Message) => Message,
  decode: (message: Message) => Message
}
