import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Prediction from '@/models/Prediction';

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const matchId = searchParams.get('matchId');
  
  const filter: any = {};
  if (userId) filter.userId = userId;
  if (matchId) filter.matchId = matchId;
  
  const predictions = await Prediction.find(filter);
  return NextResponse.json(predictions);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  
  const prediction = await Prediction.findOneAndUpdate(
    { userId: body.userId, matchId: body.matchId },
    body,
    { new: true, upsert: true }
  );
  
  return NextResponse.json(prediction);
}
