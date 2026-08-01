import axios from "axios";
import InstagramPost from "../models/InstagramPost.model.js";
import InstagramSetting from "../models/InstagramSetting.model.js";

/**
 * Sync latest posts from Instagram Graph API to MongoDB
 */
export const syncInstagramPosts = async () => {
  try {
    // 1. Get credentials (from DB or fallback to .env)
    let settings = await InstagramSetting.findOne();
    if (!settings) {
      settings = await InstagramSetting.create({
        businessId: process.env.INSTAGRAM_BUSINESS_ID || "",
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
        connectionStatus: "DISCONNECTED",
      });
    }

    const businessId = settings.businessId || process.env.INSTAGRAM_BUSINESS_ID;
    const accessToken = settings.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!businessId || !accessToken) {
      console.error("Instagram Sync Error: Missing Business ID or Access Token.");
      settings.connectionStatus = "ERROR";
      await settings.save();
      return { success: false, message: "Missing credentials." };
    }

    // 2. Fetch from Instagram Graph API
    const url = `https://graph.facebook.com/v23.0/${businessId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,children{media_url,media_type}&access_token=${accessToken}`;
    
    const response = await axios.get(url);
    const data = response.data.data; // Array of posts

    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid response from Instagram API");
    }

    // 3. Process and upsert posts
    let newCount = 0;
    let updateCount = 0;

    for (const item of data) {
      const postData = {
        instagramId: item.id,
        caption: item.caption || "",
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        thumbnailUrl: item.thumbnail_url || null,
        permalink: item.permalink,
        timestamp: new Date(item.timestamp),
        username: item.username || "",
        children: item.children?.data?.map((child) => ({
          mediaUrl: child.media_url,
          mediaType: child.media_type,
        })) || [],
      };

      const existingPost = await InstagramPost.findOne({ instagramId: item.id });
      
      if (existingPost) {
        await InstagramPost.updateOne({ instagramId: item.id }, postData);
        updateCount++;
      } else {
        await InstagramPost.create(postData);
        newCount++;
      }
    }

    // 4. Update Settings Status
    const totalPosts = await InstagramPost.countDocuments();
    settings.connectionStatus = "CONNECTED";
    settings.lastSyncTime = new Date();
    settings.importedPostsCount = totalPosts;
    await settings.save();

    console.log(`Instagram Sync Success: ${newCount} new, ${updateCount} updated.`);
    return { success: true, newCount, updateCount, totalPosts };

  } catch (error) {
    console.error("Instagram Sync Error:", error.message || error);
    
    // Update status to error
    const settings = await InstagramSetting.findOne();
    if (settings) {
      settings.connectionStatus = "ERROR";
      await settings.save();
    }
    
    return { success: false, message: error.message };
  }
};
