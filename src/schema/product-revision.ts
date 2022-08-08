import mongoose from 'mongoose';
import { IProduct, productSchema } from './product';

// Copy product schema so we can add the index
const productRevisionSchema = new mongoose.Schema<IProduct>(
  {
    ...productSchema.obj,
    _id: mongoose.Types.ObjectId,
  },
  {
    timestamps: true, // Generate createdAt and updatedAt timestamps
    minimize: false, // Preserve empty objects ({})
  }
);

productRevisionSchema.index({ productId: 1, createdAt: 1 }, { unique: true });

export const ProductRevision = mongoose.model<IProduct>('ProductRevision', productRevisionSchema);
