import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Food from '@/models/Food';
import User from '@/models/User';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { userId } = await req.json();
  const { id } = await params;
  
  const food = await Food.findById(id);
  if (!food || food.collectedBy) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  
  food.collectedBy = userId;
  await food.save();
  
  const user = await User.findById(userId);
  if (user) {
    user.foodPoints += 1;
    await user.save();
  }
  
  return NextResponse.json({ success: true });
}
