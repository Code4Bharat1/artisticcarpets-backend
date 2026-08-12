import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
  const start = Date.now();
  console.log('Connecting to MongoDB...');
  console.log('URI:', process.env.MONGO_URI ? 'Exists' : 'Missing');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected in ${Date.now() - start}ms`);
  
  const queryStart = Date.now();
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  console.log(`Fetched ${products.length} products in ${Date.now() - queryStart}ms`);
  
  console.log("Categories in DB:");
  const uniqueCats = [...new Set(products.map(p => p.category))];
  console.log(uniqueCats);
  
  mongoose.disconnect();
}

test().catch(console.error);
