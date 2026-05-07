import { Server } from 'socket.io';
import User from '../models/User.js';
import { verifyAccessToken } from '../utils/handleJwt.js';

let ioInstance = null;

export const setupSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' }
  });

  ioInstance.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!rawToken) return next(new Error('Token no proporcionado'));

      const payload = verifyAccessToken(rawToken);
      const user = await User.findOne({ _id: payload._id, deleted: { $ne: true } });
      if (!user || !user.company) return next(new Error('Usuario sin compañía válida'));

      socket.user = user;
      socket.join(user.company.toString());
      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  });

  ioInstance.on('connection', (socket) => {
    socket.emit('connection:ready', {
      socketId: socket.id,
      company: socket.user.company.toString()
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

export const emitToCompany = (companyId, event, payload) => {
  if (!ioInstance || !companyId) return;
  ioInstance.to(companyId.toString()).emit(event, payload);
};

export const closeSocket = async () => {
  if (!ioInstance) return;
  await new Promise((resolve) => ioInstance.close(resolve));
  ioInstance = null;
};
