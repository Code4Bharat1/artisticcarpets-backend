import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.model.js";

dotenv.config();

async function checkInventory() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const filter = { status: { $ne: "archived" } };
  
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .populate("productCollection", "name")
      .select("name sku mainImage stock reservedStock minimumStock price warehouse isActive")
      .sort("-updatedAt")
      .skip(0)
      .limit(10),
    Product.countDocuments(filter),
  ]);

  console.log("Total matched:", total);
  console.log("Products length:", products.length);
  if (products.length > 0) {
    console.log("First product:", JSON.stringify(products[0], null, 2));
  }
  
  process.exit(0);
}

checkInventory();
