import { Readable } from 'node:stream';
import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import crypto from 'node:crypto';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { config } from '../config/index.js';

const uploadPath = join(process.cwd(), 'uploads');
mkdirSync(uploadPath, { recursive: true });

const uploadLocal = (buffer, { folder = 'files', extension = '.bin', contentType }) => {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
  const fileName = `${safeFolder.replaceAll('/', '-')}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
  const absolutePath = join(uploadPath, fileName);
  writeFileSync(absolutePath, buffer);
  return {
    url: `${config.publicUrl}/uploads/${fileName}`,
    publicId: fileName,
    provider: 'local',
    contentType
  };
};

const uploadCloudinary = (buffer, options = {}) => new Promise((resolve, reject) => {
  const generatedPublicId = options.resourceType === 'raw' && options.extension
    ? `${crypto.randomBytes(8).toString('hex')}${options.extension}`
    : options.publicId;

  const uploadStream = cloudinary.uploader.upload_stream({
    folder: options.folder || 'bildyapp',
    resource_type: options.resourceType || 'auto',
    public_id: generatedPublicId,
    overwrite: options.overwrite,
    ...options.cloudinaryOptions
  }, (error, result) => {
    if (error) return reject(error);
    resolve({
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
      raw: result
    });
  });

  Readable.from(buffer).pipe(uploadStream);
});

export const storageService = {
  async uploadBuffer(buffer, options = {}) {
    if (isCloudinaryConfigured()) {
      return uploadCloudinary(buffer, options);
    }

    return uploadLocal(buffer, {
      folder: options.folder,
      extension: options.extension || extname(options.originalName || '') || '.bin',
      contentType: options.contentType
    });
  }
};
