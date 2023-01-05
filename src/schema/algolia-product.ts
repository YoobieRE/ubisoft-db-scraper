import mongoose from 'mongoose';
import { AlgoliaIndexName, IAlgoliaProductItem } from '../store/algolia/algolia-types';

export interface IAlgoliaProduct {
  indexName: AlgoliaIndexName;
  product: IAlgoliaProductItem;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

const algoliaProductSchema = new mongoose.Schema<IAlgoliaProductItem>(
  {
    id: { type: String, required: true, index: true },
    MasterID: { type: String, required: false, index: true },
  },
  {
    strict: false,
    minimize: false,
  }
);

export const algoliaProductParentSchema = new mongoose.Schema<IAlgoliaProduct>(
  {
    indexName: { type: String, required: true, index: true },
    product: algoliaProductSchema,
  },
  {
    timestamps: true, // Generate createdAt and updatedAt timestamps
    minimize: false, // Preserve empty objects ({})
  }
);

algoliaProductParentSchema.index({ indexName: 1, 'product.id': 1 }, { unique: true });

export const AlgoliaProduct = mongoose.model<IAlgoliaProduct>(
  'AlgoliaProduct',
  algoliaProductParentSchema
);

export type AlgoliaProductDocument = mongoose.Document<unknown, unknown, IAlgoliaProduct> &
  IAlgoliaProduct & {
    _id: mongoose.Types.ObjectId;
  };
