import { useAuth } from "../context/AuthContext";
import LogoutButton from "./LogoutButton";

export default function Navbar({ subtitle }) {
  const { user, profile } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          Job<span>Portal</span>
          {subtitle && <span className="brand-sub">{subtitle}</span>}
        </div>
        <div className="navbar-user">
          <div className="navbar-user-info">
            <strong>{profile?.name || "User"}</strong>
            <small>{user?.email}</small>
          </div>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
