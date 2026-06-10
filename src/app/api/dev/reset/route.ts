import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Bet from '@/models/Bet';
import Prediction from '@/models/Prediction';
import Result from '@/models/Result';
import Food from '@/models/Food';
import Chat from '@/models/Chat';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    // 1. Delete all match-related data
    await Promise.all([
      Result.deleteMany({}),
      Bet.deleteMany({}),
      Prediction.deleteMany({}),
      Food.deleteMany({}),
      Chat.deleteMany({}),
      mongoose.connection.db.collection('matches').deleteMany({}),
    ]);

    // 2. Reset all users to initial state
    await User.updateMany({}, {
      balance: 10000,
      foodPoints: 0,
      totalFoodMoney: 0,
      correctPredictions: 0,
      lastClaimedMatchId: '',
    });

    return NextResponse.json({ success: true, message: 'Banco de dados resetado para modo de teste' });
  } catch (error) {
    console.error('Reset failed:', error);
    return NextResponse.json({ error: 'Falha ao resetar' }, { status: 500 });
  }
}
