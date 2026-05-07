import { EventEmitter } from 'node:events';

class NotificationService extends EventEmitter {}

export const notificationService = new NotificationService();

notificationService.on('user:registered', (user) => {
  console.log(`[event:user:registered] ${user.email}`);
});

notificationService.on('user:verified', (user) => {
  console.log(`[event:user:verified] ${user.email}`);
});

notificationService.on('user:invited', ({ invitedUser, invitedBy }) => {
  console.log(`[event:user:invited] ${invitedUser.email} invitado por ${invitedBy.email}`);
});

notificationService.on('user:deleted', (user) => {
  console.log(`[event:user:deleted] ${user.email}`);
});
