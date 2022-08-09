import mongoose from 'mongoose';

export interface IManifestVersion {
  productId: number;
  manifest: string;
  releaseDate?: Date;
  digitalDistributionVersion?: number;
  communitySemver?: string;
  communityDescription?: string;
}

export const manifestVersionSchema = new mongoose.Schema<IManifestVersion>(
  {
    productId: { type: Number, required: true, index: true },
    manifest: { type: String, required: false, index: true }, // required must be false here so we can insert empty string
    releaseDate: { type: Date, required: false },
    digitalDistributionVersion: { type: Number, required: false },
    communitySemver: { type: String, required: false },
    communityDescription: { type: String, required: false },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

manifestVersionSchema.index({ productId: 1, manifest: 1 }, { unique: true });

export const ManifestVersion = mongoose.model<IManifestVersion>(
  'ManifestVersion',
  manifestVersionSchema
);
