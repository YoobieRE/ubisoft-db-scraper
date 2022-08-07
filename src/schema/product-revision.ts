import mongoose from 'mongoose';
import { IProduct, productSchema } from './product';

// Copy product schema so we can add the index
const productRevisionSchema = new mongoose.Schema<IProduct>(productSchema.obj);

productRevisionSchema.index({ _id: 1, createdAt: 1 }, { unique: true });

export const ProductRevision = mongoose.model<IProduct>('ProductRevision', productRevisionSchema);
