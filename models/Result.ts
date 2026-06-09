import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IResult extends Document {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  finished: boolean;
}

const ResultSchema = new Schema<IResult>({
  matchId: { type: String, required: true, unique: true },
  homeGoals: { type: Number, default: 0 },
  awayGoals: { type: Number, default: 0 },
  finished: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export default models.Result || model<IResult>('Result', ResultSchema);
