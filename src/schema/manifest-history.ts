import mongoose from 'mongoose';

export interface IManifestVersion {
  manifest: string;
  releaseDate?: Date;
  digitalDistributionVersion?: number;
  communitySemver?: string;
  communityDescription?: string;
}

export interface IManifestHistory {
  _id: number;
  manifestVersions?: IManifestVersion[];
}

export const manifestVersionSchema = new mongoose.Schema<IManifestVersion>({
  manifest: { type: String, required: true, index: true },
  releaseDate: { type: Date, required: false },
  digitalDistributionVersion: { type: Number, required: false },
  communitySemver: { type: String, required: false },
  communityDescription: { type: String, required: false },
});

export const manifestHistorySchema = new mongoose.Schema<IManifestHistory>({
  _id: { type: Number, required: true, index: true },
  manifestVersions: { type: manifestVersionSchema, required: false },
});

export const ManifestHistory = mongoose.model<IManifestHistory>(
  'ManifestHistory',
  manifestHistorySchema
);
