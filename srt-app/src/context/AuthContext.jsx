// Auth state for the whole app — currentUser, role, isAdmin.
// Roles live in Firestore /users/{uid}; promote someone to "admin" manually there.

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole]       = useState(null);
  const [isLoading, setIsLoading]     = useState(true);

  const fetchUserRole = async (user) => {
    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? (snap.data().role || "user") : "user";
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await fetchUserRole(user);
        setCurrentUser(user);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // Block rendering until Firebase resolves the saved session — prevents a flash of /login
  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
        Loading Sanitation Resilience Tracker...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRole,
      isLoading,
      isAdmin: userRole === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}
