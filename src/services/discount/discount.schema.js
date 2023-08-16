import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  code: { type: String, uppercase: true, required: true, unique: true },
  usedBy: [{ user: { type: Schema.Types.ObjectId, ref: 'User' } }],
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { rtpe: String },
  amount: { type: Number },
  percentage: { type: String },
  expiry_date: { type: Date, required: true },
  limit: { type: Number, required: true }
});

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Discount', schema);