import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

// Sirf Student aur Company signup kar sakte hain.
// Naya account "pending" status ke sath banta hai — admin approve karega.
export default function Signup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loader full />;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(),
        email,
        role, // "student" | "company"
        status: "pending", // admin approval ka intezar
        createdAt: serverTimestamp(),
      });

      toast.success("Account ban gaya! Admin approval ke baad access milega.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(
        err.code === "auth/email-already-in-use"
          ? "Ye email pehle se registered hai."
          : "Signup nahi ho saka, dobara try karo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          Job<span>Portal</span>
        </div>
        <p className="auth-sub">Naya account banao</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="role-select">
            <label className={role === "student" ? "role-option selected" : "role-option"}>
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === "student"}
                onChange={() => setRole("student")}
              />
              <span className="role-title">Student</span>
              <span className="role-desc">Jobs dekho aur apply karo</span>
            </label>
            <label className={role === "company" ? "role-option selected" : "role-option"}>
              <input
                type="radio"
                name="role"
                value="company"
                checked={role === "company"}
                onChange={() => setRole("company")}
              />
              <span className="role-title">Company</span>
              <span className="role-desc">Jobs post karo, hire karo</span>
            </label>
          </div>

          <div className="field">
            <label>{role === "company" ? "Company Name" : "Full Name"}</label>
            <input
              type="text"
              placeholder={role === "company" ? "e.g. ABC Technologies" : "e.g. Ali Khan"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Kam se kam 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating account..." : "Signup"}
          </button>
        </form>

        <p className="auth-foot">
          Already account hai? <Link to="/login">Login karo</Link>
        </p>
      </div>
    </div>
  );
}
