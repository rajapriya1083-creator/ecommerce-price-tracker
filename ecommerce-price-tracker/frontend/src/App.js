import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProductSearch from "./pages/ProductSearch";
import PriceComparison from "./pages/PriceComparison";
import PriceAlerts from "./pages/PriceAlerts";
import Wishlist from "./pages/Wishlist";
import SearchHistory from "./pages/SearchHistory";
import Profile from "./pages/profile";
import VisualSearch from "./pages/VisualSearch";
import PriceHistory from "./pages/PriceHistory";

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/search" element={<ProductSearch />} />
      <Route path="/compare" element={<PriceComparison />} />
      <Route path="/price-comparison" element={<PriceComparison />} />
      <Route path="/alerts" element={<PriceAlerts />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/history" element={<SearchHistory />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/visual-search" element={<VisualSearch />} />
      <Route path="/price-history" element={<PriceHistory />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </BrowserRouter>
  );
}

export default App;