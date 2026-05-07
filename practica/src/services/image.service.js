import sharp from 'sharp';

export const imageService = {
  async optimizeSignature(buffer) {
    return sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  }
};
