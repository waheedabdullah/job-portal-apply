import { useAuth } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Admin Dashboard</h1>
        <LogoutButton />
      </header>
      <p>Welcome, {user?.email}</p>
      <p>Manage users and jobs from here.</p>
    </div>
  );
}
