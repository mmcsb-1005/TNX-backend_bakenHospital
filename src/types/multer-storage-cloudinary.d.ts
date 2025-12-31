declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { v2 as cloudinary } from 'cloudinary';

  export interface CloudinaryStorageOptions {
    cloudinary: typeof cloudinary;
    params: {
      folder?: string;
      format?: string;
      public_id?: string;
      transformation?: any[];
      tags?: string[];
      quality?: string;
      fetch_format?: string;
      [key: string]: any;
    } | ((req: any, file: any) => any);
  }

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(req: any, file: any, cb: any): void;
    _removeFile(req: any, file: any, cb: any): void;
  }
}