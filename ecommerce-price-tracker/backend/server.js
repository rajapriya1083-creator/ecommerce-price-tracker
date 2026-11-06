require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./db");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const storeRoutes = require("./routes/storeRoutes");
const priceRoutes = require("./routes/priceRoutes");
const priceAlertRoutes = require("./routes/priceAlertRoutes");
const priceHistoryRoutes = require("./routes/priceHistoryRoutes");
const searchHistoryRoutes = require("./routes/searchHistoryRoutes");
const visualSearchRoutes = require("./routes/visualSearchRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const externalProductRoutes = require("./routes/externalProductRoutes");

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const frontendBuildPath = path.join(__dirname, "..", "frontend", "build");

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/price-alerts", priceAlertRoutes);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/search-history", searchHistoryRoutes);
app.use("/api/visual-search", visualSearchRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/external-products", externalProductRoutes);

app.use(express.static(frontendBuildPath));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendBuildPath, "index.html"), (error) => {
    if (error) {
      next(error);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Application running at http://localhost:${PORT}`);
});