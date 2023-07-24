import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  appleidName: { type: String },
  password: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ['super-admin', 'admin', 'staff', 'user'], default: 'user' },
  access: { type: String, enum: ['livechat', 'product', 'order', 'request'] },
  phone: { type: Number },
  address: { type: String },
}, { timestamps: true });

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.password;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('User', schema);