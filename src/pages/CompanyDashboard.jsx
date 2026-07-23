import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import { byNewest, formatDate } from "../utils/format";

const emptyForm = {
  title: "",
  location: "",
  type: "Full-time",
  salary: "",
  description: "",
};

export default function CompanyDashboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState(null);
  const [apps, setApps] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubJobs = onSnapshot(
      query(collection(db, "jobs"), where("companyId", "==", user.uid)),
      (snap) => {
        setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
      }
    );
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), where("companyId", "==", user.uid)),
      (snap) => {
        setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
      }
    );
    return () => {
      unsubJobs();
      unsubApps();
    };
  }, [user.uid]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "jobs", editingId), { ...form });
        toast.success("Job updated successfully.");
      } else {
        await addDoc(collection(db, "jobs"), {
          ...form,
          companyId: user.uid,
          companyName: profile?.name || "",
          createdAt: serverTimestamp(),
        });
        toast.success("Job posted successfully!");
      }
      resetForm();
      setTab("jobs");
    } catch {
      toast.error("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (job) => {
    setForm({
      title: job.title || "",
      location: job.location || "",
      type: job.type || "Full-time",
      salary: job.salary || "",
      description: job.description || "",
    });
    setEditingId(job.id);
    setTab("post");
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("This job and all its applications will be deleted. Are you sure?")) return;
    try {
      // Only delete this company's related apps (Firestore rules require companyId match)
      const relatedApps = (apps || []).filter((a) => a.jobId === jobId);
      await Promise.all(
        relatedApps.map((a) => deleteDoc(doc(db, "applications", a.id)))
      );
      await deleteDoc(doc(db, "jobs", jobId));
      toast.success("Job deleted successfully.");
    } catch {
      toast.error("Could not delete.");
    }
  };

  const setAppStatus = async (appId, status) => {
    try {
      await updateDoc(doc(db, "applications", appId), { status });
      toast.success(status === "accepted" ? "Application accepted." : "Application rejected.");
    } catch {
      toast.error("Could not update.");
    }
  };

  const pendingApps = (apps || []).filter((a) => a.status === "pending").length;

  return (
    <>
      <Navbar subtitle="Company" />
      <div className="container">
        <h1>Company Dashboard</h1>
        <p className="muted">Post jobs and manage applications.</p>

        <div className="tabs">
          <button
            type="button"
            className={tab === "jobs" ? "active" : ""}
            onClick={() => setTab("jobs")}
          >
            My Jobs {jobs && <span className="tab-count">{jobs.length}</span>}
          </button>
          <button
            type="button"
            className={tab === "post" ? "active" : ""}
            onClick={() => setTab("post")}
          >
            {editingId ? "Edit Job" : "Post Job"}
          </button>
          <button
            type="button"
            className={tab === "apps" ? "active" : ""}
            onClick={() => setTab("apps")}
          >
            Applications {apps && <span className="tab-count">{pendingApps}</span>}
          </button>
        </div>

        {tab === "jobs" &&
          (jobs === null ? (
            <Loader />
          ) : jobs.length === 0 ? (
            <div className="card empty">
              No jobs posted yet. Use the "Post Job" tab to create your first job.
            </div>
          ) : (
            <div className="card-grid">
              {jobs.map((job) => (
                <div className="card job-card" key={job.id}>
                  <h3>{job.title}</h3>
                  <div className="job-meta">
                    <span className="chip">{job.location}</span>
                    <span className="chip">{job.type}</span>
                    {job.salary && <span className="chip">{job.salary}</span>}
                    <span className="chip">{formatDate(job.createdAt)}</span>
                  </div>
                  <p className="job-desc">{job.description}</p>
                  <div className="job-foot">
                    <span className="muted">
                      {(apps || []).filter((a) => a.jobId === job.id).length} application(s)
                    </span>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => startEdit(job)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteJob(job.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {tab === "post" && (
          <form className="card form-card" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Job" : "Post a New Job"}</h2>
            <div className="form-row">
              <div className="field">
                <label>Job Title</label>
                <input
                  value={form.title}
                  onChange={setField("title")}
                  placeholder="e.g. Frontend Developer"
                  required
                />
              </div>
              <div className="field">
                <label>Location</label>
                <input
                  value={form.location}
                  onChange={setField("location")}
                  placeholder="e.g. Karachi / Remote"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Job Type</label>
                <select value={form.type} onChange={setField("type")}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                  <option>Remote</option>
                </select>
              </div>
              <div className="field">
                <label>Salary (optional)</label>
                <input
                  value={form.salary}
                  onChange={setField("salary")}
                  placeholder="e.g. 50,000 - 80,000 PKR"
                />
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={setField("description")}
                placeholder="Write the job requirements and details..."
                required
              />
            </div>
            <div className="row-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Job" : "Post Job"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}

        {tab === "apps" &&
          (apps === null ? (
            <Loader />
          ) : apps.length === 0 ? (
            <div className="card empty">No applications yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Job</th>
                    <th>Applied On</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.studentName}</strong>
                        <br />
                        <small className="muted">{a.studentEmail}</small>
                      </td>
                      <td>{a.jobTitle}</td>
                      <td>{formatDate(a.createdAt)}</td>
                      <td>
                        <StatusBadge value={a.status} />
                      </td>
                      <td>
                        {a.status === "pending" ? (
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => setAppStatus(a.id, "accepted")}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setAppStatus(a.id, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
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
