import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute, { roleHome } from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Loader from "./components/Loader";
import LogoutButton from "./components/LogoutButton";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import StudentDashboard from "./pages/StudentDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";

// "/" — user ko uski sahi jagah bhejta hai
function RoleRedirect() {
  const { user, role, status, loading } = useAuth();

  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace />;

  // Auth account hai lekin users/{uid} doc nahi mila
  if (!role) {
    return (
      <div className="auth-page">
        <div className="auth-card center">
          <h1>Role Set Nahi Hai</h1>
          <p className="muted">
            Aapke account ka role Firestore mein nahi mila. Admin se contact karein.
          </p>
          <LogoutButton />
        </div>
      </div>
    );
  }

  if (status !== "approved") return <Navigate to="/pending" replace />;

  return <Navigate to={roleHome[role]} replace />;
}

function App() {
  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending" element={<PendingApproval />} />

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Company */}
        <Route
          path="/company"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin (sidebar layout + nested pages) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="jobs" element={<AdminJobs />} />
        </Route>

        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
