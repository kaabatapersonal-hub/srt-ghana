// Firestore ops for reports. Photo upload intentionally omitted — Firebase Storage
// isn't available on the Spark plan in this region. Add it here when that changes.

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function submitReport(reportData, currentUser) {
  const payload = {
    facilityName:    reportData.facilityName,
    facilityType:    reportData.facilityType,
    conditionStatus: reportData.conditionStatus,
    description:     reportData.description,
    location:        reportData.location,
    photoUrl:        null,
    source:          reportData.source || "web",
    submittedBy: {
      uid:         currentUser.uid,
      displayName: currentUser.displayName || currentUser.email,
      email:       currentUser.email,
    },
    createdAt: serverTimestamp(),
    status: "pending",
  };

  // console.log('report data:', payload);
  const ref = await addDoc(collection(db, "reports"), payload);
  return ref.id;
}

export async function getUserReports(userId) {
  const q = query(
    collection(db, "reports"),
    where("submittedBy.uid", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// TODO: add pagination when report count grows past hackathon scale
export async function getAllReports() {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateReportStatus(reportId, newStatus) {
  await updateDoc(doc(db, "reports", reportId), {
    status:     newStatus,
    reviewedAt: serverTimestamp(),
  });
}
