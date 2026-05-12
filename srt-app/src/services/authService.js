// authService.js
// Contains all Firebase Authentication functions used across the app.
// Keeps auth logic in one place so pages stay clean and focused on UI.
//
// Functions exported:
//   registerUser  → create account + write user doc to Firestore
//   loginUser     → sign in with email and password
//   logoutUser    → sign out the current user
//   getFirebaseErrorMessage → convert Firebase error codes to plain English

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// --- SECTION: Register ---

// Creates a new Firebase Auth account, sets the display name,
// then writes a user document to Firestore at /users/{uid}.
// The Firestore doc is what AuthContext reads to determine the user's role.
export async function registerUser(email, password, displayName) {
  // Step 1: Create the Firebase Auth account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const newUser = userCredential.user;

  // Step 2: Save the display name on the Firebase Auth profile
  await updateProfile(newUser, { displayName: displayName });

  // Step 3: Write the user's Firestore document with role: "user"
  // This document is used by AuthContext to load the user's role on login
  await setDoc(doc(db, "users", newUser.uid), {
    uid: newUser.uid,
    email: email,
    displayName: displayName,
    role: "user",                // default role — promote to "admin" manually in Firestore
    createdAt: serverTimestamp() // server-side timestamp for accurate record-keeping
  });

  return newUser;
}

// --- SECTION: Login ---

// Signs in an existing user with their email and password.
// Firebase Auth will restore this session automatically on next app load.
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// --- SECTION: Logout ---

// Signs out the current user and clears their session.
export async function logoutUser() {
  await signOut(auth);
}

// --- SECTION: Error Messages ---

// Converts Firebase Auth error codes into user-friendly messages.
// Firebase returns codes like "auth/wrong-password" — we translate those here
// so the user sees plain English instead of technical jargon.
export function getFirebaseErrorMessage(error) {
  const errorCode = error?.code || "";

  const errorMessages = {
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Please try again.",
    "auth/invalid-credential":     "Invalid email or password. Please try again.",
    "auth/too-many-requests":      "Too many failed attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/user-disabled":          "This account has been disabled. Contact your administrator.",
  };

  // Return the mapped message, or a generic fallback for unmapped codes
  return errorMessages[errorCode] || "Something went wrong. Please try again.";
}
