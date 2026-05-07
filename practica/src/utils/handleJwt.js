import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config/index.js';

export const signAccessToken = (user) => {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }

  return jwt.sign(
    { _id: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpiresIn }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
};

export const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

export const getRefreshTokenExpiry = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + config.refreshTokenDays);
  return expiry;
};

export const createSixDigitCode = () => String(Math.floor(100000 + Math.random() * 900000));
