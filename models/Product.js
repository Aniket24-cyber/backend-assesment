import { Schema, model } from 'mongoose';
import { RequestStatus } from '../constants/constants.js'; // Import the enum

const productSchema = new Schema({
  requestId: { type: String, required: true, unique: true },
  status: {
    type: String,
    required: true,
    enum: Object.values(RequestStatus), 
  },
  failed_reason:{type : String},
  productData: [{
    productName: String,
    inputUrls: [String],
    outputUrls: [String],
  }],
}, { timestamps: true });

export default model('Product', productSchema);
