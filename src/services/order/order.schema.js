import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: {
      type: Schema.Types.ObjectId, ref: 'Products', required: true,
    },
    quantity: { type: Number, required: true },
  }],
  status: { type: String, enum: ['saved', 'processing', 'completed', 'refund-processing', 'refund'] },
  address: { type: String },
  totalprice: { type: Number },
  trxID: { type: String }
});

schema.plugin(paginate);

export default model('Orders', schema);