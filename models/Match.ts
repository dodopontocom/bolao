import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IMatch extends Document {
  id: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  group?: string;
  ground: string;
  matchDate: number;
}

const MatchSchema = new Schema<IMatch>({
  id: { type: String, required: true, unique: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  group: { type: String },
  ground: { type: String, required: true },
  matchDate: { type: Number, required: true },
}, {
  timestamps: true,
});

export default models.Match || model<IMatch>('Match', MatchSchema);
