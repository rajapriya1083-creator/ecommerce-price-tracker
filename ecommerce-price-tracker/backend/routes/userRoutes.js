const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfileImage,
  removeProfileImage
} = require("../controllers/userController");

const router = express.Router();
const PROFILE_IMAGE_DIRECTORY = path.join(
  __dirname,
  "..",
  "uploads",
  "profile-photos"
);
const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

fs.mkdirSync(PROFILE_IMAGE_DIRECTORY, { recursive: true });

const uploadProfileImage = multer({
  storage: multer.diskStorage({
    destination: PROFILE_IMAGE_DIRECTORY,
    filename: (req, file, callback) => {
      callback(
        null,
        `${crypto.randomUUID()}.${IMAGE_EXTENSIONS[file.mimetype]}`
      );
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!IMAGE_EXTENSIONS[file.mimetype]) {
      callback(new Error("Upload a JPG, PNG, WEBP, or GIF image."));
      return;
    }

    callback(null, true);
  }
}).single("profileImage");

const requireOwnAccount = (req, res, next) => {
  const authorization = req.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({ message: "Please log in to update your profile." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    if (String(decoded.id) !== req.params.id) {
      return res.status(403).json({ message: "You can only update your own profile." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Your login session has expired. Please log in again." });
  }
};

const handleProfileImageUpload = (req, res, next) => {
  uploadProfileImage(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ message: error.message });
  });
};

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", requireOwnAccount, getProfile);
router.put(
  "/:id/profile-image",
  requireOwnAccount,
  handleProfileImageUpload,
  updateProfileImage
);
router.delete("/:id/profile-image", requireOwnAccount, removeProfileImage);

module.exports = router;