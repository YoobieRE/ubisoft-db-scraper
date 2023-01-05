import mongoose from 'mongoose';

export interface IAlgoliaIndex {
  name: string;
  createdAt: Date;
}

export interface IAlgoliaIndexes {
  indexes: IAlgoliaIndex[];
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

const algoliaIndexSchema = new mongoose.Schema<IAlgoliaIndex>(
  {
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  {
    strict: false,
  }
);
export const algoliaIndexes = new mongoose.Schema<IAlgoliaIndexes>(
  {
    indexes: [algoliaIndexSchema],
  },
  {
    timestamps: true, // Generate createdAt and updatedAt timestamps
    minimize: false, // Preserve empty objects ({})
  }
);

export const AlgoliaIndexes = mongoose.model<IAlgoliaIndexes>('AlgoliaIndexes', algoliaIndexes);

export type AlgoliaIndexesDocument = mongoose.Document<unknown, unknown, IAlgoliaIndexes> &
  IAlgoliaIndexes & {
    _id: mongoose.Types.ObjectId;
  };
