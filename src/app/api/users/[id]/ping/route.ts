import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const user = await User.findById(id);
  if (user) {
    user.lastSeen = new Date();
    user.isOnline = true;
    await user.save();
  }
  return NextResponse.json({ success: true });
}
