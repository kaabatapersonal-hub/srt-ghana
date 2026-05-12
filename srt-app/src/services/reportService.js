// reportService.js
// Handles all Firestore operations for sanitation facility reports.
//
// Current functions:
//   submitReport  → saves a new report document to Firestore /reports collection
//   getUserReports → fetches all reports submitted by a specific user (used on Dashboard later)
//
// Photo upload (Firebase Storage) is intentionally skipped for now due to region limitations.
// When Storage is available, add it inside submitReport before the addDoc call:
//   const photoUrl = await uploadReportPhoto(photoFile, currentUser.uid);
// and include photoUrl in the document fields.

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// --- SECTION: Submit Report ---

// Saves a completed report to Firestore under the /reports collection.
// Each report document stores facility details, condition, GPS, and who submitted it.
// Returns the new document's ID on success.
//
// reportData fields:
//   facilityName    (string)  — name/ID of the facility
//   facilityType    (string)  — "borehole" | "latrine" | "handwashing" | etc.
//   conditionStatus (string)  — "good" | "fair" | "poor" | "critical"
//   description     (string)  — field agent's observation notes
//   location        (object)  — { latitude, longitude, accuracy } or null if GPS was skipped
//
// currentUser: the Firebase Auth user object from AuthContext
export async function submitReport(reportData, currentUser) {
  const reportsCollectionRef = collection(db, "reports");

  // Build the document we'll save to Firestore
  const reportDocument = {
    facilityName:    reportData.facilityName,
    facilityType:    reportData.facilityType,
    conditionStatus: reportData.conditionStatus,
    description:     reportData.description,
    location:        reportData.location,   // null if the user skipped GPS capture
    photoUrl:        null,                  // placeholder — will be filled when Storage is added

    // Track who submitted this report for accountability and admin review
    submittedBy: {
      uid:         currentUser.uid,
      displayName: currentUser.displayName || currentUser.email,
      email:       currentUser.email,
    },

    createdAt: serverTimestamp(), // Firestore server time — not the user's device clock
    status: "pending",            // "pending" | "approved" | "rejected" — reviewed by admin
  };

  const newDocRef = await addDoc(reportsCollectionRef, reportDocument);
  return newDocRef.id; // Return the new document's ID so the UI can reference it
}

// --- SECTION: Fetch User's Reports ---

// Returns all reports submitted by a specific user, newest first.
// Used on the Dashboard to show a field agent their submission history.
export async function getUserReports(userId) {
  const reportsCollectionRef = collection(db, "reports");

  // Query: only reports where submittedBy.uid matches this user, sorted newest first
  const userReportsQuery = query(
    reportsCollectionRef,
    where("submittedBy.uid", "==", userId),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(userReportsQuery);

  // Convert the Firestore snapshot array into a plain JavaScript array of objects
  return querySnapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

// --- SECTION: Fetch All Reports (Admin) ---

// Returns all reports across all users, newest first.
// Only called from the Admin panel — ProtectedRoute ensures only admins reach that page.
export async function getAllReports() {
  const reportsCollectionRef = collection(db, "reports");

  const allReportsQuery = query(
    reportsCollectionRef,
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(allReportsQuery);

  return querySnapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}
