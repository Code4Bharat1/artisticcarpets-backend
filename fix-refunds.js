import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/order.model.js";

dotenv.config();

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    const orders = await Order.find({ status: "refunded", "refund.status": "None" });
    console.log(`Found ${orders.length} orders to fix.`);
    
    for (const order of orders) {
      if (!order.refund) order.refund = {};
      order.refund.status = "Refunded";
      order.refund.completedAt = new Date();
      await order.save();
      console.log(`Fixed order: ${order.orderNumber}`);
    }

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
