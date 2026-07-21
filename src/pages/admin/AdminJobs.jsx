import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../firebase";
import Loader from "../../components/Loader";
import { byNewest, formatDate } from "../../utils/format";

export default function AdminJobs() {
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    return onSnapshot(collection(db, "jobs"), (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
    });
  }, []);

  const deleteJob = async (jobId) => {
    if (!window.confirm("Ye job aur iski saari applications delete ho jayengi. Pakka?")) return;
    try {
      const appsSnap = await getDocs(
        query(collection(db, "applications"), where("jobId", "==", jobId))
      );
      await Promise.all(appsSnap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, "jobs", jobId));
      toast.success("Job delete ho gayi.");
    } catch {
      toast.error("Delete nahi ho saka.");
    }
  };

  if (jobs === null) return <Loader />;

  return (
    <>
      <h1>Jobs</h1>
      <p className="muted">Portal ki saari jobs — zaroorat par delete karo.</p>

      {jobs.length === 0 ? (
        <div className="card empty" style={{ marginTop: "1.25rem" }}>
          Abhi koi job post nahi hui.
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: "1.25rem" }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Type</th>
                <th>Posted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                  </td>
                  <td>{job.companyName}</td>
                  <td>{job.location}</td>
                  <td>{job.type}</td>
                  <td>{formatDate(job.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteJob(job.id)}
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
