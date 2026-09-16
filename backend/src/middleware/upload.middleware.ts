import multer from "multer";
import { HttpError } from "../utils/httpError.js";

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export const uploadSalarySlip = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new HttpError(400, "Salary slip must be a PDF, JPG, or PNG."));
    }
    return cb(null, true);
  }
});
