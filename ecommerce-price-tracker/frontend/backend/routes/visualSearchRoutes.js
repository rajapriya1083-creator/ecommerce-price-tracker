const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    visualSearch
} = require("../controllers/visualSearchController");

const router = express.Router();

// ==========================================
// CREATE UPLOADS FOLDER
// ==========================================

const uploadFolder = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, {
        recursive: true
    });
}

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname);

        const filename =
            Date.now() +
            "-" +
            Math.round(Math.random() * 100000) +
            extension;

        cb(null, filename);
    }

});

// ==========================================
// IMAGE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {

        cb(null, true);

    } else {

        cb(
            new Error("Only image files are allowed"),
            false
        );

    }

};

// ==========================================
// UPLOAD
// ==========================================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }

});

// ==========================================
// VISUAL SEARCH API
// ==========================================

router.post(
    "/",
    upload.single("image"),
    visualSearch
);

module.exports = router;