import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Firestore users/{uid} doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // Live listener: signup ke waqt doc thodi der baad banta hai,
      // aur admin approve kare to status turant update hota hai.
      unsubProfile = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snap) => {
          setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
          setLoading(false);
        },
        () => {
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const role = profile?.role || null;
  // Admin hamesha approved. Purane docs (jinme status field nahi) bhi approved.
  const status = !profile
    ? null
    : role === "admin"
      ? "approved"
      : profile.status || "approved";

  return (
    <AuthContext.Provider value={{ user, profile, role, status, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
