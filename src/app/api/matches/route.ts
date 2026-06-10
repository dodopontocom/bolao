import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import { fetchMatches } from '@/data/matches';

export async function GET() {
  await dbConnect();
  
  const db = mongoose.connection.db;
  const collection = db.collection('matches');
  
  try {
    // 1. Always fetch fresh data from GitHub
    const fetchedMatches = await fetchMatches();
    
    // 2. Deduplicate in memory
    const uniqueMatches = Array.from(new Map(fetchedMatches.map(m => [m.id, m])).values());

    // 3. Sync with DB (Update scores and metadata if they changed)
    const ops = uniqueMatches.map(m => ({
      updateOne: {
        filter: { id: m.id },
        update: { $set: m },
        upsert: true
      }
    }));

    if (ops.length > 0) {
      await collection.bulkWrite(ops);
    }
  } catch (err) {
    console.error('Failed to sync matches from GitHub, using cache:', err);
  }
  
  // 4. Return whatever is in DB (now synced or from cache)
  const matchesInDb = await collection.find({}).toArray();
  return NextResponse.json(matchesInDb);
}
