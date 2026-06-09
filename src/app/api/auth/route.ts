import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  await dbConnect();
  
  const { pin } = await req.json();
  const validPin = process.env.PIN_CODE;
  
  if (pin === validPin) {
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 401 });
}
