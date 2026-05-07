import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  number: { type: String, trim: true },
  postal: { type: String, trim: true },
  city: { type: String, trim: true },
  province: { type: String, trim: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false },
  name: { type: String, trim: true, default: null },
  lastName: { type: String, trim: true, default: null },
  nif: { type: String, uppercase: true, trim: true, default: null },
  role: { type: String, enum: ['admin', 'guest'], default: 'admin', index: true },
  status: { type: String, enum: ['pending', 'verified'], default: 'pending', index: true },
  verificationCode: { type: String, select: false },
  verificationAttempts: { type: Number, default: 3, select: false },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
  address: addressSchema,
  deleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('fullName').get(function fullName() {
  return [this.name, this.lastName].filter(Boolean).join(' ');
});

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject({ virtuals: true });
  delete user.password;
  delete user.verificationCode;
  delete user.verificationAttempts;
  return user;
};

export default mongoose.model('User', userSchema);
