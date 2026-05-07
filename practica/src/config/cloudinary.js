import { v2 as cloudinary } from 'cloudinary';
import { config } from './index.js';

if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
  });
}

export const isCloudinaryConfigured = () => Boolean(
  config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret
);

export default cloudinary;
