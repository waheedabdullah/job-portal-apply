import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../firebase";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import { byNewest, formatDate } from "../../utils/format";

export default function AdminApplicants() {
  const [apps, setApps] = useState(null);

  useEffect(() => {
    return onSnapshot(collection(db, "applications"), (snap) => {
      setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
    });
  }, []);

  const deleteApp = async (appId) => {
    if (!window.confirm("Delete this application? Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "applications", appId));
      toast.success("Application deleted.");
    } catch {
      toast.error("Could not delete.");
    }
  };

  if (apps === null) return <Loader />;

  return (
    <>
      <h1>Applicants</h1>
      <p className="muted">All job applications across the portal.</p>

      {apps.length === 0 ? (
        <div className="card empty" style={{ marginTop: "1.25rem" }}>
          No applications yet.
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: "1.25rem" }}>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Job</th>
                <th>Company</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.studentName || "—"}</strong>
                    <br />
                    <small className="muted">{a.studentEmail}</small>
                  </td>
                  <td>{a.jobTitle}</td>
                  <td>{a.companyName}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td>
                    <StatusBadge value={a.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteApp(a.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
