import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  productName: { type: String, required: true },
  description: { type: String, required: true },
  origin: { type: String, required: true },
  images: [{ type: String, required: true }],
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, enum: ['electronics', 'shoe', 'watch', 'beauty', 'accessories', 'budgetshopping'] },
  subcategory: { type: String, required: true, enum: ['electronics', 'shoe', 'watch', 'beauty', 'accessories', 'budgetshopping'] },
  tags: { type: String, required: true },
  link: { type: String, required: true },
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' }
});

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Products', schema);