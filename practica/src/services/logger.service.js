import { IncomingWebhook } from '@slack/webhook';
import { config } from '../config/index.js';

const webhook = config.slackWebhook ? new IncomingWebhook(config.slackWebhook) : null;

export const sendSlackError = async ({ err, req, statusCode }) => {
  if (!webhook || statusCode < 500) return;

  const text = [
    '🚨 *Error 5XX en BildyApp API*',
    `*Timestamp:* ${new Date().toISOString()}`,
    `*Método:* ${req.method}`,
    `*Ruta:* ${req.originalUrl}`,
    `*Status:* ${statusCode}`,
    `*Mensaje:* ${err.message}`,
    `*Stack:*\n\`\`\`${err.stack || 'Sin stack'}\`\`\``
  ].join('\n');

  try {
    await webhook.send({ text });
  } catch (error) {
    console.error('Error enviando log a Slack:', error.message);
  }
};
