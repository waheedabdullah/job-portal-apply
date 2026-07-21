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
        <h1>{rejected ? "Request Reject Ho Gayi" : "Admin Approval Pending"}</h1>
        <p className="muted">
          {rejected
            ? "Maazrat, admin ne aapki request reject kar di hai. Mazeed maloomat ke liye admin se raabta karein."
            : "Aapka account ban gaya hai. Admin approve karega to aapko turant access mil jayega — ye page khud update ho jayega."}
        </p>
        <p className="muted">
          Logged in as: <strong>{profile?.email || user.email}</strong>
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
