import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IFood extends Document {
  emoji: string;
  x: number;
  y: number;
  collectedBy: mongoose.Types.ObjectId | null;
  expiresAt: Date;
}

const FoodSchema = new Schema<IFood>({
  emoji: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
});

export default models.Food || model<IFood>('Food', FoodSchema);
