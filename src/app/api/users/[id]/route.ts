import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Check if it's a food claim
    if (body.action === 'claimFood') {
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      
      if (user.foodPoints < 10) {
        return NextResponse.json({ error: 'Pontos insuficientes' }, { status: 400 });
      }
      
      if (user.lastClaimedMatchId === body.matchId) {
        return NextResponse.json({ error: 'Já resgatado nesta partida' }, { status: 400 });
      }

      // No longer subtracting foodPoints - Level is persistent
      user.balance += 1000;
      user.totalFoodMoney = (user.totalFoodMoney || 0) + 1000;
      user.lastClaimedMatchId = body.matchId;
      await user.save();
      
      return NextResponse.json(user);
    }

    // Normal profile update
    const { name, avatar, city, jargon } = body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, avatar, city, jargon },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
