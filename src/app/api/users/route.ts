import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  const users = await User.find({}).sort({ lastSeen: -1 });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name, avatar, city } = await req.json();
  
  const existingUser = await User.findOne({ name });
  if (existingUser) {
    existingUser.lastSeen = new Date();
    existingUser.isOnline = true;
    if (city) existingUser.city = city;
    await existingUser.save();
    return NextResponse.json(existingUser);
  }
  
  const user = await User.create({ name, avatar, city, isOnline: true });
  return NextResponse.json(user);
}
