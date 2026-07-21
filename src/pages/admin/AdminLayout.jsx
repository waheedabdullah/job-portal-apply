import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoutButton from "../../components/LogoutButton";

export default function AdminLayout() {
  const { user, profile } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Job<span>Portal</span>
          <small>Admin Panel</small>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end>
            Overview
          </NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/jobs">Jobs</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{profile?.name || "Admin"}</strong>
            <small>{user?.email}</small>
          </div>
          <LogoutButton light />
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
