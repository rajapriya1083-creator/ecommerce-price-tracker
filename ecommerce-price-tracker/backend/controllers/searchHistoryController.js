const SearchHistory = require("../models/SearchHistory");

exports.getSearchHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.body?.userId;
    const filter = userId ? { userId } : {};

    const history = await SearchHistory.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch search history",
      error: error.message
    });
  }
};

exports.addSearchHistory = async (req, res) => {
  try {
    const { userId, keyword } = req.body;

    if (!userId || !keyword) {
      return res.status(400).json({ message: "userId and keyword are required" });
    }

    const newEntry = new SearchHistory({ userId, keyword });

    await newEntry.save();

    return res.status(201).json({
      message: "Search saved successfully",
      data: newEntry
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save search history",
      error: error.message
    });
  }
};

exports.clearSearchHistory = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.params?.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    await SearchHistory.deleteMany({ userId });

    return res.status(200).json({
      message: "Search history cleared successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to clear search history",
      error: error.message
    });
  }
};
