import { createServer } from 'node:http';
import app from './app.js';
import { closeDB, config, connectDB } from './config/index.js';
import { closeSocket, setupSocket } from './socket/index.js';

await connectDB();

const httpServer = createServer(app);
setupSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${config.port}`);
  console.log(`Entorno: ${config.nodeEnv}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} recibido. Cerrando servidor...`);

  httpServer.close(async () => {
    await closeSocket();
    await closeDB();
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forzando cierre por timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
