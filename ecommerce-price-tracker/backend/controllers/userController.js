const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const PROFILE_IMAGE_DIRECTORY = path.join(
  __dirname,
  "..",
  "uploads",
  "profile-photos"
);

const deleteProfileImageFile = async (imageUrl) => {
  const prefix = "/uploads/profile-photos/";
  if (!imageUrl?.startsWith(prefix)) return;

  const filename = path.basename(imageUrl.slice(prefix.length));
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(filename)) return;

  try {
    await fs.promises.unlink(path.join(PROFILE_IMAGE_DIRECTORY, filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Unable to remove replaced profile image:", error);
    }
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1d"
    });

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email profileImage"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Unable to load profile" });
  }
};

exports.updateProfileImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Choose an image to upload" });
  }

  let savedImagePath = "";

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      await fs.promises.unlink(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    const imageUrl = `/uploads/profile-photos/${req.file.filename}`;
    const oldImageUrl = user.profileImage;
    user.profileImage = imageUrl;
    await user.save();
    savedImagePath = imageUrl;

    await deleteProfileImageFile(oldImageUrl);

    return res.status(200).json({
      message: "Profile photo updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error("Update profile photo error:", error);

    if (!savedImagePath) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Unable to remove failed profile image upload:", cleanupError);
        }
      }
    }

    return res.status(500).json({ message: "Unable to update profile photo" });
  }
};

exports.removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldImageUrl = user.profileImage;
    user.profileImage = "";
    await user.save();
    await deleteProfileImageFile(oldImageUrl);

    return res.status(200).json({
      message: "Profile photo removed",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: ""
      }
    });
  } catch (error) {
    console.error("Remove profile photo error:", error);
    return res.status(500).json({ message: "Unable to remove profile photo" });
  }
};