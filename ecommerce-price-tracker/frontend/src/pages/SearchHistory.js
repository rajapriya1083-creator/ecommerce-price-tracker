import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import "./SearchHistory.css";

function SearchHistory({ onBack, onSearch, userId }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/search-history`);

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Backend returned invalid JSON.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load search history.");
      }

      const historyData = Array.isArray(data)
        ? data
        : Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.searchHistory)
            ? data.searchHistory
            : [];

      setHistory(historyData);
    } catch (error) {
      console.error("Search history error:", error);
      setError(error.message || "Unable to load search history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const clearHistory = async () => {
    const currentUserId =
      userId ||
      localStorage.getItem("userId") ||
      sessionStorage.getItem("userId");

    if (!currentUserId) {
      alert("Please log in first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/search-history/clear`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      const responseText = await response.text();

      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText || "No response from server" };
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to clear search history");
      }

      setHistory([]);
      alert(data.message || "Search history cleared successfully");
    } catch (error) {
      console.error("Clear history error:", error);
      alert(error.message);
    }
  };

  const searchAgain = (productName) => {
    if (onSearch) {
      onSearch(productName);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    const formatted = new Date(date);

    if (Number.isNaN(formatted.getTime())) return "";

    return formatted.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="history-page">
      <div className="history-container">
        <button
          type="button"
          className="history-back-button"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              navigate(-1);
            }
          }}
        >
          ← Back
        </button>

        <div className="history-header">
          <h1>🕘 Search History</h1>
          <p>Your recently searched products.</p>
        </div>

        {loading && (
          <div className="history-message">
            <div className="history-icon">🔄</div>
            <h2>Loading Search History...</h2>
          </div>
        )}

        {!loading && error && (
          <div className="history-message">
            <div className="history-icon">❌</div>
            <h2>{error}</h2>
            <button onClick={fetchHistory} className="history-retry-button">
              🔄 Try Again
            </button>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="history-message">
            <div className="history-icon">🕘</div>
            <h2>No Search History</h2>
            <p>Products you search for will appear here.</p>
            <button
              className="search-products-button"
              onClick={() => {
                if (onBack) onBack();
              }}
            >
              🔎 Search Products
            </button>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="history-content">
            <div className="history-top-bar">
              <h2>
                🕘 {history.length} {history.length === 1 ? "Search" : "Searches"}
              </h2>

              <button type="button" onClick={clearHistory} className="clear-btn">
                Clear Search History
              </button>
            </div>

            <div className="history-list">
              {history.map((item, index) => (
                <div
                  className="history-item"
                  key={item._id || `${item.productName}-${index}`}
                >
                  <div className="history-item-icon">🔎</div>

                  <div className="history-item-details">
                    <h3>{item.productName}</h3>
                    <p>🕘 {formatDate(item.createdAt)}</p>
                  </div>

                  <button
                    className="search-again-button"
                    onClick={() => searchAgain(item.productName)}
                  >
                    🔎 Search Again
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchHistory;