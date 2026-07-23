import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import { byNewest, formatDate } from "../utils/format";

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("browse");
  const [jobs, setJobs] = useState(null);
  const [apps, setApps] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, "jobs"), (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
    });
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), where("studentId", "==", user.uid)),
      (snap) => {
        setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
      }
    );
    return () => {
      unsubJobs();
      unsubApps();
    };
  }, [user.uid]);

  const appliedJobIds = new Set((apps || []).map((a) => a.jobId));

  const handleApply = async (job) => {
    setApplyingId(job.id);
    try {
      await addDoc(collection(db, "applications"), {
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        studentId: user.uid,
        studentName: profile?.name || "",
        studentEmail: user.email,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast.success("Application submitted!");
    } catch {
      toast.error("Could not apply. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <>
      <Navbar subtitle="Student" />
      <div className="container">
        <h1>Student Dashboard</h1>
        <p className="muted">Browse jobs and apply.</p>

        <div className="tabs">
          <button
            type="button"
            className={tab === "browse" ? "active" : ""}
            onClick={() => setTab("browse")}
          >
            Browse Jobs {jobs && <span className="tab-count">{jobs.length}</span>}
          </button>
          <button
            type="button"
            className={tab === "apps" ? "active" : ""}
            onClick={() => setTab("apps")}
          >
            My Applications {apps && <span className="tab-count">{apps.length}</span>}
          </button>
        </div>

        {tab === "browse" &&
          (jobs === null ? (
            <Loader />
          ) : jobs.length === 0 ? (
            <div className="card empty">
              No jobs available right now. Please check again later.
            </div>
          ) : (
            <div className="card-grid">
              {jobs.map((job) => {
                const applied = appliedJobIds.has(job.id);
                return (
                  <div className="card job-card" key={job.id}>
                    <h3>{job.title}</h3>
                    <div className="job-company">{job.companyName}</div>
                    <div className="job-meta">
                      <span className="chip">{job.location}</span>
                      <span className="chip">{job.type}</span>
                      {job.salary && <span className="chip">{job.salary}</span>}
                      <span className="chip">{formatDate(job.createdAt)}</span>
                    </div>
                    <p className="job-desc">{job.description}</p>
                    <div className="job-foot">
                      {applied ? (
                        <StatusBadge value="applied" />
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={applyingId === job.id}
                          onClick={() => handleApply(job)}
                        >
                          {applyingId === job.id ? "Applying..." : "Apply Now"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "apps" &&
          (apps === null ? (
            <Loader />
          ) : apps.length === 0 ? (
            <div className="card empty">
              You have not applied to any jobs yet. Start from "Browse Jobs".
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Company</th>
                    <th>Applied On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.jobTitle}</strong>
                      </td>
                      <td>{a.companyName}</td>
                      <td>{formatDate(a.createdAt)}</td>
                      <td>
                        <StatusBadge value={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </>
  );
}
