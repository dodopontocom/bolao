import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bet from '@/models/Bet';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const matchId = searchParams.get('matchId');
  
  const filter: any = {};
  if (userId) filter.userId = userId;
  if (matchId) filter.matchId = matchId;
  
  const bets = await Bet.find(filter).populate('userId');
  return NextResponse.json(bets);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  
  const user = await User.findById(body.userId);
  if (!user || user.balance < body.amount) {
    return NextResponse.json({ success: false, error: 'Saldo insuficiente' }, { status: 400 });
  }
  
  user.balance -= body.amount;
  await user.save();
  
  const bet = await Bet.create(body);
  return NextResponse.json(bet);
}
