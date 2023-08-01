import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  orderNumber: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String },
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
  date: { type: Date, default: Date.now },
  insideDhaka: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'shipping', 'cancel'], default: 'pending' },
  shippingaddress: {
    name: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    zip: { type: String, required: true },
  },
  billingaddress: {
    name: { type: String },
    address: { type: String },
    city: { type: String },
    area: { type: String },
    zip: { type: String },
  },
  phone: { type: String },
  alternativephone: { type: String },
  instructions: { type: String },
  discountApplied: { type: String },
  val_id: { type: String },
  sessionkey: { type: String },
  trxID: { type: String }
});

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Orders', schema);