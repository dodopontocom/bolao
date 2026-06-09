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
  const { name, avatar, city, grito } = await req.json();
  
  const existingUser = await User.findOne({ name });
  if (existingUser) {
    existingUser.lastSeen = new Date();
    existingUser.isOnline = true;
    if (city) existingUser.city = city;
    if (grito) existingUser.grito = grito;
    await existingUser.save();
    return NextResponse.json(existingUser);
  }
  
  const user = await User.create({ name, avatar, city, grito, isOnline: true });
  return NextResponse.json(user);
}
