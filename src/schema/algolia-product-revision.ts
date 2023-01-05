import mongoose from 'mongoose';
import { IAlgoliaProduct, algoliaProductParentSchema } from './algolia-product';

const revisionSchema = algoliaProductParentSchema.obj;

// Copy product schema so we can add the index
const algoliaProductRevisionSchema = new mongoose.Schema<IAlgoliaProduct>(revisionSchema, {
  timestamps: true, // Generate createdAt and updatedAt timestamps
  minimize: false, // Preserve empty objects ({})
});

export const AlgoliaProductRevision = mongoose.model<IAlgoliaProduct>(
  'AlgoliaProductRevision',
  algoliaProductRevisionSchema
);
