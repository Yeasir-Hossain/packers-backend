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
  number: { type: String },
  deliveredon: {
    from: { type: Date },
    to: { type: Date }
  },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'shipping', 'refund', 'canceled'], default: 'pending' },
  address: { type: String },
  alternativephone: { type: String },
  instructions: { type: String },
  totalprice: { type: Number },
  trxID: { type: String }
});

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Orders', schema);