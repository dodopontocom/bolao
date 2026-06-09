import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  await dbConnect();
  
  const { pin } = await req.json();
  const envPins = process.env.PIN_CODE || '199,455';
  const validPins = envPins.split(',').map(p => p.trim());
  
  if (validPins.includes(pin)) {
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 401 });
}
