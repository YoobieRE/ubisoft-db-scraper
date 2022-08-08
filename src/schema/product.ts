import mongoose from 'mongoose';
import { game_configuration } from 'ubisoft-demux';

export interface IProduct {
  _id: number;
  productId: number;
  configuration?: game_configuration.Configuration | string;
  manifest?: string;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

export const productSchema = new mongoose.Schema<IProduct>(
  {
    _id: { type: Number, required: true },
    productId: { type: Number, required: true },
    configuration: { type: Object, required: false },
    manifest: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Generate createdAt and updatedAt timestamps
    minimize: false, // Preserve empty objects ({})
  }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);
