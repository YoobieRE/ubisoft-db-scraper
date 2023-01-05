import mongoose from 'mongoose';
import * as shop from '../store/shop/shop-types';

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
    c_productLauncherIDString: { type: String, required: false, index: true },
    c_productOwnershipUplayGameID: { type: String, required: false, index: true },
    // TODO: index product ID fields
  },
  {
    strict: false,
  }
);

export const shopProductParentSchema = new mongoose.Schema<IShopProduct>(
  {
    siteId: { type: String, required: true, index: true },
    product: shopProductSchema,
  },
  {
    timestamps: true, // Generate createdAt and updatedAt timestamps
    minimize: false, // Preserve empty objects ({})
  }
);

export const ShopProduct = mongoose.model<IShopProduct>('ShopProduct', shopProductParentSchema);

export type ShopProductDocument = mongoose.Document<unknown, unknown, IShopProduct> &
  IShopProduct & {
    _id: mongoose.Types.ObjectId;
  };
