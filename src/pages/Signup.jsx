import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import PasswordInput from "../components/PasswordInput";

// Only Student and Company can sign up.
// New accounts are created with "pending" status — admin will approve.
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
        status: "pending", // waiting for admin approval
        createdAt: serverTimestamp(),
      });

      toast.success("Account created! You will get access after admin approval.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(
        err.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : "Signup failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Job<span>Portal</span>
        </Link>
        <p className="auth-sub">Create a new account</p>

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
              <span className="role-desc">Browse jobs and apply</span>
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
              <span className="role-desc">Post jobs and hire talent</span>
            </label>
          </div>

          <div className="field">
            <label>{role === "company" ? "Company Name" : "Full Name"}</label>
            <input
              type="text"
              placeholder={role === "company" ? "Enter your company name" : "Enter your name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <PasswordInput
              placeholder="Enter your password"
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
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
