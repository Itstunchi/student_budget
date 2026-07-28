import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";

export default function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  // Wait while Firebase checks the user's login status
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not logged in, send them to Login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated
  return children;
}