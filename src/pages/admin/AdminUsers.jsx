import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../firebase";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import { byNewest, formatDate } from "../../utils/format";

export default function AdminUsers() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Pending first, then newest
      rows.sort((a, b) => {
        const pa = a.role !== "admin" && a.status === "pending" ? 0 : 1;
        const pb = b.role !== "admin" && b.status === "pending" ? 0 : 1;
        return pa - pb || byNewest(a, b);
      });
      setUsers(rows);
    });
  }, []);

  const setStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "users", id), { status });
      toast.success(status === "approved" ? "User approved." : "User rejected.");
    } catch {
      toast.error("Could not update.");
    }
  };

  if (users === null) return <Loader />;

  return (
    <>
      <h1>Users</h1>
      <p className="muted">Approve or reject new signups.</p>

      <div className="table-wrap" style={{ marginTop: "1.25rem" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const status = u.role === "admin" ? "approved" : u.status || "approved";
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name || "—"}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <StatusBadge value={u.role} />
                  </td>
                  <td>
                    <StatusBadge value={status} />
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    {u.role === "admin" ? (
                      <span className="muted">—</span>
                    ) : status === "pending" ? (
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => setStatus(u.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setStatus(u.id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : status === "rejected" ? (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => setStatus(u.id, "approved")}
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setStatus(u.id, "rejected")}
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
