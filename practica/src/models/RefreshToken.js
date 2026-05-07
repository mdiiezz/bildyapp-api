import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  createdByIp: { type: String, default: null },
  revokedByIp: { type: String, default: null }
}, {
  timestamps: true,
  versionKey: false
});

refreshTokenSchema.methods.isActive = function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
};

export default mongoose.model('RefreshToken', refreshTokenSchema);
