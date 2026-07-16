import CmsPage from "../models/cms.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

const DEFAULT_PAGES = [
  "homepage", "about-us", "contact", "faq",
  "privacy-policy", "terms", "shipping-policy",
];

export const getPage = asyncHandler(async (req, res) => {
  const { pageKey } = req.params;

  let page = await CmsPage.findOne({ pageKey, isActive: true });

  // Return empty skeleton if page doesn't exist yet
  if (!page) {
    return successResponse(res, {
      page: { pageKey, title: pageKey, content: "", sections: [] },
    }, "CMS page fetched (empty).");
  }

  return successResponse(res, { page }, "CMS page fetched.");
});

export const getAllPages = asyncHandler(async (req, res) => {
  const pages = await CmsPage.find()
    .populate("lastUpdatedBy", "firstName lastName")
    .select("pageKey title isActive updatedAt");

  return successResponse(res, { pages }, "CMS pages fetched.");
});

export const upsertPage = asyncHandler(async (req, res) => {
  const { pageKey } = req.params;

  const page = await CmsPage.findOneAndUpdate(
    { pageKey },
    { $set: { ...req.body, lastUpdatedBy: req.user._id } },
    { new: true, upsert: true, runValidators: true }
  );

  await createAuditLog({
    user: req.user, action: "UPDATE_CMS_PAGE", module: "CMS",
    targetId: page._id, targetName: pageKey, req,
  });

  return successResponse(res, { page }, "CMS page saved.");
});

export const deletePage = asyncHandler(async (req, res) => {
  const { pageKey } = req.params;

  if (DEFAULT_PAGES.includes(pageKey)) {
    return errorResponse(res, "Cannot delete a default system page.", 400);
  }

  await CmsPage.findOneAndDelete({ pageKey });
  return successResponse(res, {}, "CMS page deleted.");
});
