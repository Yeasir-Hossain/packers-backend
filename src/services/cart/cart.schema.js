import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: {
      type: Schema.Types.ObjectId, ref: 'Products'
    },
    productQuantity: { type: Number },
  }],
  requests: [{
    request: {
      type: Schema.Types.ObjectId, ref: 'Request'
    },
    requestQuantity: { type: Number },
  }],
  discountApplied: {
    amount: { type: String },
    percentage: { type: String },
    code: { type: String }
  },
});

schema.plugin(paginate);
schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Cart', schema);