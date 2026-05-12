import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export async function registerUser(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  await updateProfile(user, { displayName });

  // Write the Firestore doc so AuthContext can read the role on next load
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    displayName,
    role: "user",         // promote to "admin" manually in Firestore Console
    createdAt: serverTimestamp(),
  });

  return user;
}

export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export async function logoutUser() {
  await signOut(auth);
}

export function getFirebaseErrorMessage(error) {
  const code = error?.code || "";
  const messages = {
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
  return messages[code] || "Something went wrong. Please try again.";
}
