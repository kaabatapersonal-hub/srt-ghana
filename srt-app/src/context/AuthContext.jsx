// AuthContext.jsx
// Provides authentication state to the entire app using React Context.
// Tracks: who is logged in (currentUser), what their role is (userRole),
// and whether the auth check is still running (isLoading).
//
// Role system:
//   - "admin" → can approve reports, manage facilities, access /admin page
//   - "user"  → can submit reports and view the map/dashboard
//
// Roles are stored in Firestore at: /users/{uid}/role
// When a new account is created, a document is added there with role: "user".
// To promote someone to admin, manually change their role field to "admin" in Firestore.
//
// Usage in any component:
//   import { useAuth } from "../context/AuthContext";
//   const { currentUser, isAdmin } = useAuth();

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";

// --- SECTION: Create Context ---

// AuthContext is the container for auth state shared across the app
const AuthContext = createContext(null);

// useAuth is a convenience hook — components call this instead of useContext(AuthContext) directly
export function useAuth() {
  return useContext(AuthContext);
}

// --- SECTION: Auth Provider Component ---

// AuthProvider wraps the whole app (in main.jsx or App.jsx).
// It listens for Firebase auth changes and keeps the state in sync.
export function AuthProvider({ children }) {
  // currentUser: the Firebase user object when logged in, or null when logged out
  const [currentUser, setCurrentUser] = useState(null);

  // userRole: "admin" or "user" — loaded from Firestore after login
  const [userRole, setUserRole] = useState(null);

  // isLoading: true while Firebase is checking the stored session on first load
  // We must wait for this before rendering any routes, to avoid a flash of "logged out"
  const [isLoading, setIsLoading] = useState(true);

  // --- SECTION: Fetch User Role from Firestore ---

  // Reads the user's role from their Firestore document at /users/{uid}
  // Returns "user" as a safe default if the document does not exist yet
  async function fetchUserRole(firebaseUser) {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // role field should be "admin" or "user"
      return userDocSnap.data().role || "user";
    }

    // No Firestore document yet — default to "user" (safe fallback)
    return "user";
  }

  // --- SECTION: Auth State Listener ---

  useEffect(() => {
    // onAuthStateChanged fires once immediately on mount to restore any saved session,
    // then fires again whenever the user logs in or out
    const unsubscribeFromAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in — also fetch their role from Firestore
        const role = await fetchUserRole(firebaseUser);
        setCurrentUser(firebaseUser);
        setUserRole(role);
      } else {
        // User logged out — clear everything
        setCurrentUser(null);
        setUserRole(null);
      }

      // Auth check is complete — allow the app to render
      setIsLoading(false);
    });

    // Return the unsubscribe function so the listener is removed when AuthProvider unmounts
    return unsubscribeFromAuth;
  }, []);

  // --- SECTION: Context Value ---

  const contextValue = {
    currentUser,            // Firebase user object or null
    userRole,               // "admin" | "user" | null
    isLoading,              // boolean — true while Firebase is initializing
    isAdmin: userRole === "admin",  // shorthand boolean for admin checks
  };

  // --- SECTION: Loading Gate ---

  // Block the entire app from rendering until Firebase has confirmed the auth state.
  // Without this, protected routes would briefly redirect logged-in users to /login.
  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
        Loading Sanitation Resilience Tracker...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
