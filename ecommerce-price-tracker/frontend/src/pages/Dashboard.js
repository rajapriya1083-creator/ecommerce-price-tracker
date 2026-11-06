import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const dashboardLinks = [
  { label: "Product Search", icon: "🔎", to: "/search" },
  { label: "Visual Search", icon: "🔵", to: "/visual-search" },
  { label: "Price Comparison", icon: "💰", to: "/compare" },
  { label: "Price History", icon: "📈", to: "/price-history" },
  { label: "Search History", icon: "🕘", to: "/history" },
  { label: "Price Alerts", icon: "🔔", to: "/alerts" },
  { label: "Wishlist", icon: "❤️", to: "/wishlist" },
  { label: "Profile", icon: "👤", to: "/profile" },
];

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>📊 Dashboard</h1>
          <p>Welcome to your E-Commerce Price Tracker</p>
        </header>

        <nav className="dashboard-menu" aria-label="Dashboard menu">
          {dashboardLinks.map(({ label, icon, to }) => (
            <Link
              className="dashboard-menu-item"
              to={to}
              key={to}
            >
              <span className="dashboard-menu-icon" aria-hidden="true">
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          ))}
          <button
            className="dashboard-menu-item dashboard-logout"
            type="button"
            onClick={handleLogout}
          >
            <span className="dashboard-menu-icon" aria-hidden="true">
              🚪
            </span>
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </main>
  );
}

export default Dashboard;
