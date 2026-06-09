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
  const { userId, matchId, amount, outcome, odd } = body;
  
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
  }

  // Check if user already has a bet for this match
  const existingBet = await Bet.findOne({ userId, matchId });
  
  if (existingBet) {
    if (existingBet.settled) {
      return NextResponse.json({ success: false, error: 'Aposta já encerrada' }, { status: 400 });
    }
    
    // Refund previous amount and deduct new amount
    const balanceDiff = existingBet.amount - amount;
    if (user.balance + balanceDiff < 0) {
      return NextResponse.json({ success: false, error: 'Saldo insuficiente' }, { status: 400 });
    }
    
    user.balance += balanceDiff;
    await user.save();
    
    existingBet.amount = amount;
    existingBet.outcome = outcome;
    existingBet.odd = odd;
    await existingBet.save();
    
    return NextResponse.json(existingBet);
  } else {
    if (user.balance < amount) {
      return NextResponse.json({ success: false, error: 'Saldo insuficiente' }, { status: 400 });
    }
    
    user.balance -= amount;
    await user.save();
    
    const bet = await Bet.create(body);
    return NextResponse.json(bet);
  }
}
