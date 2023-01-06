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
  },
  {
    strict: false,
  }
);
shopProductSchema.index({ c_productLauncherIDString: 1 });
shopProductSchema.index({ c_productOwnershipUplayGameID: 1 });
shopProductSchema.index({ c_productDlcBaseString: 1 });
shopProductSchema.index({ c_productOtherEditionsListString: 1 });
shopProductSchema.index({ 'master.master_id': 1 });
shopProductSchema.index({ 'variants.product_id': 1 });

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
