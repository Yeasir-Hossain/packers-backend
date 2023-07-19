import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  requestNumber: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  link: { type: String, required: true },
  note: { type: String },
  images: [{ type: String }],
  quantity: { type: Number, required: true },
  sellerTakes: { type: Number },
  address: { type: String },
  tax: { type: Number },
  fee: { type: Number },
  status: { type: String, enum: ['pending', 'abandoned', 'completed', 'paid', 'sent', 'processing'], default: 'pending' },
  trxId: { type: String }
});

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Request', schema);