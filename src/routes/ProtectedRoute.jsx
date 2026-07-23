import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

export const roleHome = {
  admin: "/admin",
  student: "/student",
  company: "/company",
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, status, loading } = useAuth();

  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/" replace />;

  // Role doc not found → NoRole screen on "/"
  if (!role) return <Navigate to="/" replace />;

  // Student/Company not approved yet → pending screen
  if (status !== "approved") return <Navigate to="/pending" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={roleHome[role] || "/"} replace />;
  }

  return children;
}
