
import { updateOrderStatus } from "./controllers/order.controller.js";
import mongoose from "mongoose";

const req = {
  params: { id: "6a6b16bf2a626a9d7d793fab" },
  body: { status: "shipped", trackingNumber: "njjnnj", carrier: "lkmm" },
  user: { _id: new mongoose.Types.ObjectId() }
};

const res = {
  status: (code) => ({
    json: (data) => console.log("Response:", code, data)
  })
};

const next = (err) => console.error("Next called with error:", err);

mongoose.connect("mongodb://localhost:27017/artisticcarpets")
  .then(() => {
    console.log("Connected to DB");
    updateOrderStatus(req, res, next).then(() => {
      console.log("Finished");
      process.exit(0);
    });
  })
  .catch(err => console.error(err));

