import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IChat extends Document {
  userId: string;
  userName: string;
  message: string;
  createdAt: Date;
  expiresAt: Date;
}

const ChatSchema = new Schema<IChat>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  message: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
});

// Auto-delete after 15 seconds is handled by TTL index or manual cleanup
// But we want it svelte, so we'll just use expiresAt in query

export default models.Chat || model<IChat>('Chat', ChatSchema);
