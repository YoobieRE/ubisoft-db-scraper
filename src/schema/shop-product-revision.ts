import mongoose from 'mongoose';
import { IShopProduct, shopProductParentSchema } from './shop-product';

const revisionSchema = shopProductParentSchema.obj;

// Copy product schema so we can add the index
const shopProductRevisionSchema = new mongoose.Schema<IShopProduct>(revisionSchema, {
  timestamps: true, // Generate createdAt and updatedAt timestamps
  minimize: false, // Preserve empty objects ({})
});

export const ShopProductRevision = mongoose.model<IShopProduct>(
  'ShopProductRevision',
  shopProductRevisionSchema
);
