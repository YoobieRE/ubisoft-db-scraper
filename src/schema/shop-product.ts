import mongoose from 'mongoose';
import * as shop from '../store/shop-types';

export interface IShopProduct {
  siteId: shop.SiteID;
  product: shop.Product;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

const shopProductSchema = new mongoose.Schema<shop.Product>(
  {
    id: { type: String, required: true, index: true },
    currency: { type: String, required: true, index: true },
  },
  {
    strict: false,
  }
);

export const shopProductParentSchema = new mongoose.Schema<IShopProduct>(
  {
    siteId: { type: String, required: true },
    product: shopProductSchema,
  },
  {
    timestamps: true, // Generate createdAt and updatedAt timestamps
    minimize: false, // Preserve empty objects ({})
  }
);

export const ShopProduct = mongoose.model<IShopProduct>('ShopProduct', shopProductParentSchema);
