import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Result from '@/models/Result';
import Bet from '@/models/Bet';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  const results = await Result.find({});
  const resultsMap: Record<string, any> = {};
  results.forEach(r => {
    resultsMap[r.matchId] = r;
  });
  return NextResponse.json(resultsMap);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const { adminPin, matchId, homeGoals, awayGoals, finished } = await req.json();

  if (adminPin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 401 });
  }

  const result = await Result.findOneAndUpdate(
    { matchId },
    { homeGoals, awayGoals, finished },
    { new: true, upsert: true }
  );

  if (finished) {
    const bets = await Bet.find({ matchId, settled: false });
    for (const bet of bets) {
      let won = false;
      let actualOutcome: 'home' | 'draw' | 'away' = 'draw';
      
      if (homeGoals > awayGoals) actualOutcome = 'home';
      else if (homeGoals < awayGoals) actualOutcome = 'away';
      
      won = bet.outcome === actualOutcome;
      
      let payout = 0;
      if (won) {
        payout = Math.round(bet.amount * bet.odd);
        const user = await User.findById(bet.userId);
        if (user) {
          user.balance += payout;
          await user.save();
        }
      }
      
      bet.settled = true;
      bet.won = won;
      bet.payout = payout;
      await bet.save();
    }
  }

  return NextResponse.json(result);
}
