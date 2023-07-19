import { Schema, model } from 'mongoose';

const schema = new Schema({
  category: { type: String, reqired: true },
  categorySlug: { type: String, required: true },
  subCategory: [{ 
    subCategoryName: { type: String },
    subCategorySlug: { type: String }
  }]

});

schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return JSON.parse(JSON.stringify(obj).replace(/_id/g, 'id'));
};

export default model('Category', schema);