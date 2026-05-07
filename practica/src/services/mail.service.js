import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const hasMailConfig = Boolean(config.mailHost && config.mailUser && config.mailPass);

const transporter = hasMailConfig
  ? nodemailer.createTransport({
      host: config.mailHost,
      port: config.mailPort,
      secure: config.mailSecure,
      auth: {
        user: config.mailUser,
        pass: config.mailPass
      }
    })
  : null;

export const mailService = {
  async sendVerificationCode(user) {
    if (!transporter) {
      console.log(`[MAIL DEV] Código de verificación para ${user.email}: ${user.verificationCode}`);
      return;
    }

    await transporter.sendMail({
      from: config.mailFrom,
      to: user.email,
      subject: 'Código de verificación BildyApp',
      text: `Tu código de verificación es: ${user.verificationCode}`,
      html: `<p>Tu código de verificación es: <strong>${user.verificationCode}</strong></p>`
    });
  }
};
