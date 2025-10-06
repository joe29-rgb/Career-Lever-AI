declare module 'pdf2pic' {
  interface ConvertOptions {
    density?: number
    saveFilename?: string
    savePath?: string
    format?: 'jpeg' | 'png'
    width?: number
    height?: number
  }

  interface ConvertResult {
    path: string
    size: number
    base64?: string
  }

  class pdf2pic {
    constructor(fromPath: string, toPath?: string)
    convert(input: Buffer | string, options?: ConvertOptions): Promise<ConvertResult[]>
  }

  export = pdf2pic
}
