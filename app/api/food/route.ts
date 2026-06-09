import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Food from '@/models/Food';
import User from '@/models/User';

const FOOD_EMOJIS = ['🍕', '🍔', '🌭', '🍟', '🌮', '🍿', '🍩', '🍪', '🍫', '🍬', '🍭', '🍰', '🧁', '🎂', '🍹', '🍺', '🍻', '🥂', '🍷', '☕'];

export async function GET() {
  await dbConnect();
  await Food.deleteMany({ expiresAt: { $lt: new Date() } });
  const foods = await Food.find({ collectedBy: null });
  return NextResponse.json(foods);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    // No body, proceed
  }
  
  const food = await Food.create({
    emoji: body.emoji || FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    expiresAt: new Date(Date.now() + 60000),
  });
  
  return NextResponse.json(food);
}
