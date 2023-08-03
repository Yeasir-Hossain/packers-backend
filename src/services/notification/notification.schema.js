import { Schema, model } from 'mongoose';

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', require: true },
  message: { type: String },
  type: { type: String, enum: ['account', 'cart'] },
  time: { type: Date, default: Date.now() }
});

schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Notification', schema);