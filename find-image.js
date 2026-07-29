import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.model.js";

dotenv.config();

async function findImage() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const p1 = await Product.findOne({ thumbnail: { $ne: null } }).select("title thumbnail images");
  const p2 = await Product.findOne({ "images.0": { $exists: true } }).select("title thumbnail images");

  console.log("Has thumbnail:", JSON.stringify(p1, null, 2));
  console.log("Has images:", JSON.stringify(p2, null, 2));
  
  process.exit(0);
}

findImage();
