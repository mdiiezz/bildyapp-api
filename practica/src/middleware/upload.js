import multer from 'multer';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const uploadPath = join(process.cwd(), 'uploads');
mkdirSync(uploadPath, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const name = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const imageFilter = (req, file, cb) => {
  if (imageMimes.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Tipo de archivo no permitido. Solo imágenes jpeg, png, webp o gif.'));
};

export const uploadLogo = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('logo');

export const uploadSignature = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('signature');
