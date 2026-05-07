import mongoose from 'mongoose';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbUri: process.env.DB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  slackWebhook: process.env.SLACK_WEBHOOK || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  mailHost: process.env.MAIL_HOST || '',
  mailPort: Number(process.env.MAIL_PORT || 587),
  mailSecure: process.env.MAIL_SECURE === 'true',
  mailUser: process.env.MAIL_USER || '',
  mailPass: process.env.MAIL_PASS || '',
  mailFrom: process.env.MAIL_FROM || 'BildyApp <no-reply@bildyapp.local>'
};

export const connectDB = async () => {
  if (!config.dbUri) {
    console.error('DB_URI no está definida en .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.dbUri);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
};
