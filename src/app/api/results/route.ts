import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Result from '@/models/Result';
import Bet from '@/models/Bet';
import Prediction from '@/models/Prediction';
import User from '@/models/User';
import { calculatePredictionReward } from '@/lib/services/matchService';

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
  const body = await req.json();
  const { adminPin, matchId, homeGoals, awayGoals, finished } = body;

  // Em desenvolvimento, o simulador não envia PIN
  if (process.env.NODE_ENV !== 'development' && adminPin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 401 });
  }

  const hGoals = parseInt(homeGoals.toString());
  const aGoals = parseInt(awayGoals.toString());

  const result = await Result.findOneAndUpdate(
    { matchId },
    { homeGoals: hGoals, awayGoals: aGoals, finished },
    { new: true, upsert: true }
  );

  if (finished) {
    // 1. Process Monetary Bets (N$)
    const bets = await Bet.find({ matchId, settled: false });
    for (const bet of bets) {
      let actualOutcome: 'home' | 'draw' | 'away' = 'draw';
      
      if (hGoals > aGoals) actualOutcome = 'home';
      else if (hGoals < aGoals) actualOutcome = 'away';
      
      const won = bet.outcome === actualOutcome;
      let payout = 0;

      if (won) {
        payout = Math.round(bet.amount * bet.odd);
        const user = await User.findById(bet.userId);
        if (user) {
          user.balance += payout;
          user.correctPredictions = (user.correctPredictions || 0) + 1;
          await user.save();
        }
      }
      
      await Bet.findByIdAndUpdate(bet._id, {
        settled: true,
        won: won,
        payout: payout
      });
    }

    // 2. Process Score Predictions (Bolão)
    const predictions = await Prediction.find({ matchId, settled: { $ne: true } });
    for (const pred of predictions) {
      const reward = calculatePredictionReward(
        { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals },
        { homeGoals: hGoals, awayGoals: aGoals }
      );

      if (reward > 0) {
        const user = await User.findById(pred.userId);
        if (user) {
          user.balance += reward;
          // Only increment if not already incremented by the monetary bet (to avoid double counting same match)
          const alreadyWonBet = bets.find(b => b.userId.toString() === user._id.toString() && b.won);
          if (!alreadyWonBet) {
            user.correctPredictions = (user.correctPredictions || 0) + 1;
          }
          await user.save();
        }
      }
      
      // Mark prediction as settled so it's never processed again
      await Prediction.findByIdAndUpdate(pred._id, { settled: true });
    }
  }

  return NextResponse.json(result);
}
