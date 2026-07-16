import { validationResult } from "express-validator";
import { errorResponse } from "../utils/apiResponse.js";

/**
 * Runs after express-validator chains.
 * If there are validation errors, returns 422 with the list of messages.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return errorResponse(res, "Validation failed.", 422, messages);
  }
  next();
};
