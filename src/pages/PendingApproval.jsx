import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";

export default function PendingApproval() {
  const { user, status, profile, loading } = useAuth();

  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;
  if (status === "approved") return <Navigate to="/" replace />;

  const rejected = status === "rejected";

  return (
    <div className="auth-page">
      <div className="auth-card center">
        <div className="auth-brand">
          Job<span>Portal</span>
        </div>
        <StatusBadge value={rejected ? "rejected" : "pending"} />
        <h1>{rejected ? "Request Rejected" : "Admin Approval Pending"}</h1>
        <p className="muted">
          {rejected
            ? "Sorry, the admin rejected your request. Please contact the admin for more information."
            : "Your account has been created. Once an admin approves it, you will get access automatically — this page will update on its own."}
        </p>
        <p className="muted">
          Logged in as: <strong>{profile?.email || user.email}</strong>
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
