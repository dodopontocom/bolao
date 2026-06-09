import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

export async function GET() {
  await dbConnect();
  // Cleanup old messages
  await Chat.deleteMany({ expiresAt: { $lt: new Date() } });
  
  const messages = await Chat.find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: 1 });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const { userId, userName, message } = await req.json();
  
  const chat = await Chat.create({
    userId,
    userName,
    message,
    expiresAt: new Date(Date.now() + 15000), // 15 seconds
  });
  
  return NextResponse.json(chat);
}
