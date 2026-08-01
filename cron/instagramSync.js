import cron from "node-cron";
import { syncInstagramPosts } from "../services/instagramService.js";

/**
 * Initialize all Instagram-related cron jobs
 */
export const initInstagramCron = () => {
  // Run every 60 minutes
  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled Instagram sync...");
    await syncInstagramPosts();
  });
  console.log("⏰ Instagram sync cron job initialized (runs every hour).");
};
