import mongoose from 'mongoose';
import { game_configuration, product_store_configuration, store_service } from 'ubisoft-demux';

export interface IExpandedStoreProduct
  extends Omit<Partial<store_service.StoreProduct>, 'configuration'> {
  configuration?:
    | product_store_configuration.UpsellStoreConfiguration
    | product_store_configuration.IngameStoreConfiguration;
}

export interface IStoreTypeProductMap {
  upsell?: IExpandedStoreProduct;
  ingame?: IExpandedStoreProduct;
}

export interface IProduct {
  _id: number;
  productId: number;
  manifest?: string;
  configuration?: game_configuration.Configuration | string;
  storeProduct?: IStoreTypeProductMap;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

export const productSchema = new mongoose.Schema<IProduct>(
  {
    _id: { type: Number, required: true },
    productId: { type: Number, required: true },
    manifest: { type: String, required: false },
    configuration: { type: Object, required: false },
    storeProduct: { type: Object, required: false }, // Defining this schema causes a lot of nonsense around default values and _id's being generated, which breaks the JSON diffing
  },
  {
    timestamps: true, // Generate createdAt and updatedAt timestamps
    minimize: false, // Preserve empty objects ({})
  }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);

export type ProductDocument = mongoose.Document<unknown, unknown, IProduct> & IProduct;
