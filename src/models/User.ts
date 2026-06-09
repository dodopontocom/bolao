import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IUser extends Document {
  name: string;
  avatar: string;
  balance: number;
  foodPoints: number;
  lastSeen: Date;
  isOnline: boolean;
  city?: string;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, unique: true },
  avatar: { type: String, required: true },
  balance: { type: Number, default: 10000 },
  foodPoints: { type: Number, default: 0 },
  totalFoodPoints: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  city: { type: String },
  lastClaimedMatchId: { type: String, default: '' },
}, {
  timestamps: true,
});

export default models.User || model<IUser>('User', UserSchema);
