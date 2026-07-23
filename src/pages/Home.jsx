import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { roleHome } from "../routes/ProtectedRoute";

export default function Home() {
  const { user, role, status, loading } = useAuth();

  if (loading) return <Loader full />;

  if (user) {
    if (!role) {
      return (
        <div className="auth-page">
          <div className="auth-card center">
            <h1>Role Not Found</h1>
            <p className="muted">
              Your account role was not found. Please contact the admin.
            </p>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        </div>
      );
    }
    if (status !== "approved") return <Navigate to="/pending" replace />;
    return <Navigate to={roleHome[role]} replace />;
  }

  return (
    <div className="home-page">
      <header className="home-nav">
        <div className="brand">
          Job<span>Portal</span>
        </div>
        <div className="home-nav-actions">
          <Link to="/login" className="btn btn-outline">
            Login
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="home-hero">
        <p className="home-eyebrow">Find work. Hire talent.</p>
        <h1>
          Your next opportunity
          <br />
          starts here
        </h1>
        <p className="home-lead">
          Students discover jobs. Companies post openings. Admins keep the portal
          running smoothly — all in one place.
        </p>
        <div className="home-cta">
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
          <Link to="/signup" className="btn btn-outline">
            Create Account
          </Link>
        </div>
      </main>
    </div>
  );
}
