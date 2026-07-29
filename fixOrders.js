import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "./models/order.model.js";

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/artisticcarpets");
    console.log("Connected to MongoDB.");

    const orders = await Order.find({});
    for (let order of orders) {
      if (!order.customerSnapshot || !order.customerSnapshot.email || order.customerSnapshot.email === "guest@example.com") {
        order.customerSnapshot = {
          name: "Alexander Sterling",
          email: "alexander@artisticcarpets.com",
          phone: "+91 98765 43210"
        };
        
        order.shippingAddress = {
          firstName: "Alexander",
          lastName: "Sterling",
          addressLine1: "123 Artistic Way",
          city: "Mumbai",
          state: "MH",
          postalCode: "400001",
          country: "India"
        };
        
        await order.save();
        console.log(`Updated order ${order.orderNumber}`);
      }
    }
    console.log("Done updating orders!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating orders:", error);
    process.exit(1);
  }
}

fixOrders();
