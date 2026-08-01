import InstagramPost from "../models/InstagramPost.model.js";
import InstagramSetting from "../models/InstagramSetting.model.js";
import { syncInstagramPosts } from "../services/instagramService.js";

/**
 * @route   GET /api/instagram
 * @desc    Get paginated instagram posts
 * @access  Public
 */
export const getInstagramPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const posts = await InstagramPost.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InstagramPost.countDocuments();

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/instagram/:id
 * @desc    Get single instagram post by MongoDB ID or instagramId
 * @access  Public
 */
export const getInstagramPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    let post = await InstagramPost.findById(id);

    if (!post) {
      post = await InstagramPost.findOne({ instagramId: id });
    }

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/instagram/admin/settings
 * @desc    Get Instagram settings for Admin Panel
 * @access  Private/Admin
 */
export const getSettings = async (req, res, next) => {
  try {
    let settings = await InstagramSetting.findOne();
    if (!settings) {
      settings = await InstagramSetting.create({
        businessId: process.env.INSTAGRAM_BUSINESS_ID || "",
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/instagram/admin/settings
 * @desc    Update Instagram settings
 * @access  Private/Admin
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { businessId, accessToken } = req.body;
    let settings = await InstagramSetting.findOne();

    if (!settings) {
      settings = new InstagramSetting();
    }

    if (businessId !== undefined) settings.businessId = businessId;
    if (accessToken !== undefined) settings.accessToken = accessToken;

    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/instagram/admin/sync
 * @desc    Manually trigger sync
 * @access  Private/Admin
 */
export const triggerSync = async (req, res, next) => {
  try {
    const result = await syncInstagramPosts();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
};
