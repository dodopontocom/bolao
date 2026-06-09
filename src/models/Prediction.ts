import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IPrediction extends Document {
  userId: mongoose.Types.ObjectId;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
}

const PredictionSchema = new Schema<IPrediction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: String, required: true },
  homeGoals: { type: Number, required: true },
  awayGoals: { type: Number, required: true },
}, {
  timestamps: true,
});

PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export default models.Prediction || model<IPrediction>('Prediction', PredictionSchema);
