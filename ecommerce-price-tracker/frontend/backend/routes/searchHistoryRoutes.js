const express = require("express");
const {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory
} = require("../controllers/searchHistoryController");

const router = express.Router();

router.get("/", getSearchHistory);
router.post("/", addSearchHistory);
router.delete("/clear", clearSearchHistory);

module.exports = router;