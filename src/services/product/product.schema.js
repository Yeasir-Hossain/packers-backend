import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  productName: { type: String, required: true },
  description: { type: String },
  origin: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

schema.plugin(paginate);

export default model('Products', schema);