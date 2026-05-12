// firebaseConfig.js
// Initializes the Firebase app and exports the three services used across the project:
//   - auth    → Firebase Authentication (login / logout / register)
//   - db      → Firestore database (storing reports, users, facility data)
//   - storage → Firebase Storage (uploading photos of sanitation facilities)
//
// All other files import from here. Firebase must only be initialized once.
// IMPORTANT: Replace every placeholder value below with your actual Firebase project config.
// Find your config at: Firebase Console → Project Settings → Your Apps → Web App.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- SECTION: Firebase Project Config ---

// These values are safe to commit to a public repo (Firebase uses security rules, not secrets).
// Never paste your private service account key here — that is different and must stay secret.
const firebaseConfig = {
  apiKey: "AIzaSyBbpGZ2c5PCMU9cQ_1SBmLGz7DR8JeXprU",
  authDomain: "srt-ghana.firebaseapp.com",
  projectId: "srt-ghana",
  storageBucket: "srt-ghana.firebasestorage.app",
  messagingSenderId: "648568182579",
  appId: "1:648568182579:web:7d4302a6d0298c2bdb1046",
  measurementId: "G-G2QDDJN0D3"  // optional — used by Firebase Analytics only
};

// --- SECTION: Initialize Firebase ---

// initializeApp connects our app to the Firebase project defined above
const firebaseApp = initializeApp(firebaseConfig);

// --- SECTION: Export Services ---

// Each service is exported individually so other files only import what they need
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
