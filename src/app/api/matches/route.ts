import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import { fetchMatches } from '@/data/matches';

export async function GET() {
  await dbConnect();
  
  // Get collection directly to bypass schema issues
  const db = mongoose.connection.db;
  const collection = db.collection('matches');
  
  // Delete all matches
  await collection.deleteMany({});
  
  const fetchedMatches = await fetchMatches();
  
  // Insert directly
  await collection.insertMany(fetchedMatches);
  
  // Get and return
  const matches = await collection.find({}).toArray();
  return NextResponse.json(matches);
}
