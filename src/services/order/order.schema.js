import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  orderNumber: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: {
      type: Schema.Types.ObjectId, ref: 'Products',
    },
    productQuantity: { type: Number },
  }],
  requests: [{
    request: {
      type: Schema.Types.ObjectId, ref: 'Request'
    },
    requestQuantity: { type: Number },
  }],
  deliveredon: {
    from: { type: Date },
    to: { type: Date }
  },
  date:{type:Date, default: Date.now()},
  insideDhaka: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'shipping', 'refund', 'refund-processing', 'canceled'], default: 'pending' },
  address: { type: String },
  phone: { type: String },
  alternativephone: { type: String },
  instructions: { type: String },
  trxID: { type: String }
});

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Orders', schema);