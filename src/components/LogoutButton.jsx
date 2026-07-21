import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function LogoutButton({ light }) {
  return (
    <button
      type="button"
      className={light ? "btn btn-outline-light btn-sm" : "btn btn-outline btn-sm"}
      onClick={() => signOut(auth)}
    >
      Logout
    </button>
  );
}
