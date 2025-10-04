declare module 'pdf-parse-debugging-disabled' {
  interface PDFData {
    text: string;
    pages: number;
    version: string;
    info: any;
  }

  function pdfParse(buffer: Buffer): Promise<PDFData>;
  export = pdfParse;
}
