declare module 'compression' {
  import { RequestHandler } from 'express';

  interface CompressionOptions {
    chunkSize?: number;
    filter?: (req: any, res: any) => boolean;
    level?: number;
    memLevel?: number;
    strategy?: number;
    threshold?: number | string;
    windowBits?: number;
    flush?: number;
    finishFlush?: number;
    [key: string]: any;
  }

  function compression(options?: CompressionOptions): RequestHandler;
  namespace compression {
    export function filter(req: any, res: any): boolean;
  }

  export = compression;
}
