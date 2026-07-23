import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import Loader from "../../components/Loader";

export default function AdminOverview() {
  const [users, setUsers] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [apps, setApps] = useState(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "users"), (s) =>
      setUsers(s.docs.map((d) => d.data()))
    );
    const u2 = onSnapshot(collection(db, "jobs"), (s) => setJobs(s.docs.length));
    const u3 = onSnapshot(collection(db, "applications"), (s) => setApps(s.docs.length));
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  if (users === null || jobs === null || apps === null) return <Loader />;

  const students = users.filter((u) => u.role === "student").length;
  const companies = users.filter((u) => u.role === "company").length;
  const pending = users.filter(
    (u) => u.role !== "admin" && u.status === "pending"
  ).length;

  return (
    <>
      <h1>Overview</h1>
      <p className="muted">Full portal summary — updates in realtime.</p>

      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-value">{users.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <Link to="/admin/users" className="card stat-card stat-card-link">
          <span className="stat-value stat-warn">{pending}</span>
          <span className="stat-label">Pending Approvals</span>
        </Link>
        <Link to="/admin/users" className="card stat-card stat-card-link">
          <span className="stat-value">{students}</span>
          <span className="stat-label">Students</span>
        </Link>
        <Link to="/admin/users" className="card stat-card stat-card-link">
          <span className="stat-value">{companies}</span>
          <span className="stat-label">Companies</span>
        </Link>
        <Link to="/admin/jobs" className="card stat-card stat-card-link">
          <span className="stat-value stat-accent">{jobs}</span>
          <span className="stat-label">Jobs Posted</span>
        </Link>
        <Link to="/admin/applicants" className="card stat-card stat-card-link">
          <span className="stat-value stat-accent">{apps}</span>
          <span className="stat-label">Applications</span>
        </Link>
      </div>

      {pending > 0 && (
        <p style={{ marginTop: "1.25rem" }}>
          {pending} user(s) are waiting for approval — go to the "Users" tab to approve or reject.
        </p>
      )}
    </>
  );
}
