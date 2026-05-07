import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  number: { type: String, trim: true },
  postal: { type: String, trim: true },
  city: { type: String, trim: true },
  province: { type: String, trim: true }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  projectCode: { type: String, required: true, uppercase: true, trim: true },
  address: addressSchema,
  email: { type: String, lowercase: true, trim: true },
  notes: { type: String, trim: true },
  active: { type: Boolean, default: true, index: true },
  deleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  versionKey: false
});

projectSchema.index(
  { company: 1, projectCode: 1 },
  { unique: true, partialFilterExpression: { deleted: { $ne: true } } }
);

export default mongoose.model('Project', projectSchema);
