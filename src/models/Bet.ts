import mongoose, { Schema, Document, model, models } from 'mongoose';

export type BetOutcome = 'home' | 'draw' | 'away';

export interface IBet extends Document {
  userId: mongoose.Types.ObjectId;
  matchId: string;
  amount: number;
  outcome: BetOutcome;
  odd: number;
  settled: boolean;
  won: boolean;
  payout: number;
}

const BetSchema = new Schema<IBet>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: String, required: true },
  amount: { type: Number, required: true },
  outcome: { type: String, enum: ['home', 'draw', 'away'], required: true },
  odd: { type: Number, required: true },
  settled: { type: Boolean, default: false },
  won: { type: Boolean, default: false },
  payout: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export default models.Bet || model<IBet>('Bet', BetSchema);
