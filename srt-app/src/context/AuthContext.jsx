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

  if (isLoading) {
    return (
      <div className="app-splash">
        <div className="app-splash-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="#1a6b2e"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
            <path d="M50,20 C55.5,26.5 61,34 61,40 A11,11 0 0,1 39,40 C39,34 44.5,26.5 50,20 Z" fill="white"/>
            <text x="50" y="72" fontFamily="Arial,Helvetica,sans-serif" fontWeight="bold" fontSize="26" fill="white" textAnchor="middle">SRT</text>
          </svg>
        </div>
        <h1 className="app-splash-title">Sanitation Resilience Tracker</h1>
        <p className="app-splash-sub">Northern Ghana · UNICEF StartUp Lab 2026</p>
        <div className="app-splash-bar">
          <div className="app-splash-bar-fill" />
        </div>
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
