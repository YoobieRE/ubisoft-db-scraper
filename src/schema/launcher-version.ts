import mongoose from 'mongoose';

export interface ILauncherVersion {
  latestVersion: number;
  patchTrackId: string;
}

export const launcherVersionSchema = new mongoose.Schema<ILauncherVersion>(
  {
    latestVersion: { type: Number, required: true },
    patchTrackId: { type: String, required: true },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

launcherVersionSchema.index({ latestVersion: 1, patchTrackId: 1 }, { unique: true });

export const LauncherVersion = mongoose.model<ILauncherVersion>(
  'LauncherVersion',
  launcherVersionSchema
);

export type LauncherVersionDocument = mongoose.Document<unknown, unknown, ILauncherVersion> &
  ILauncherVersion;
