import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-links">
        <Link to="/dashboard">📊 Dashboard</Link>
        <Link to="/search">🔎 Product Search</Link>
        <Link to="/visual-search">🔵 Visual Search</Link>
        <Link to="/compare">💰 Price Comparison</Link>
        <Link to="/price-history">📈 Price History</Link>
        <Link to="/history">🕘 Search History</Link>
        <Link to="/alerts">🔔 Price Alerts</Link>
        <Link to="/wishlist">❤️ Wishlist</Link>
        <Link to="/profile">Profile</Link>
        
        <button type="button" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;