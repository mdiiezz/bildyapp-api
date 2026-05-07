import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  number: { type: String, trim: true },
  postal: { type: String, trim: true },
  city: { type: String, trim: true },
  province: { type: String, trim: true }
}, { _id: false });

const clientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  cif: { type: String, required: true, uppercase: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  address: addressSchema,
  deleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  versionKey: false
});

clientSchema.index(
  { company: 1, cif: 1 },
  { unique: true, partialFilterExpression: { deleted: { $ne: true } } }
);

export default mongoose.model('Client', clientSchema);
