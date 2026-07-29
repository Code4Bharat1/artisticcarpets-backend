import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/order.model.js";
import User from "./models/user.model.js";

dotenv.config();

async function fixNames() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // Fix Orders
    const orders = await Order.find({ "customerSnapshot.name": { $exists: true } });
    let orderCount = 0;
    for (const order of orders) {
      if (order.customerSnapshot && order.customerSnapshot.name) {
        const parts = order.customerSnapshot.name.split(" ");
        if (parts.length === 2 && parts[0] === parts[1]) {
          order.customerSnapshot.name = parts[0];
          await order.save();
          orderCount++;
        }
      }
    }
    console.log(`Fixed ${orderCount} duplicated order names.`);
    
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
}

fixNames();
