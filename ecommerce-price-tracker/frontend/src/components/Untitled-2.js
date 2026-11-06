// ...existing imports...
import { Link, useNavigate, useLocation } from "react-router-dom";
// ...existing imports...

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  if (["/", "/login", "/register"].includes(location.pathname)) {
    return null;
  }

  // ...keep the rest of your existing Navbar component...
}