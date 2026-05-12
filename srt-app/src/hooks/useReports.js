// useReports.js
// Custom React hook that listens to the Firestore /reports collection in real time.
// Uses onSnapshot so the dashboard updates automatically when new reports are submitted —
// no page refresh needed.
//
// Spark plan safe:
//   - One persistent listener (not a repeated polling query)
//   - Costs 1 read per document on initial load, then 1 read per changed doc after that
//   - limit(100) caps the max reads per load at 100, well within the 50K/day free quota
//
// Usage:
//   const { reports, isLoading, error } = useReports();
//   Then filter reports client-side — no extra queries needed.

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

// maxCount: how many reports to load at most — default 100 is enough for hackathon scale
export function useReports(maxCount = 100) {
  const [reports, setReports]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    // Query: all reports, newest first, capped at maxCount
    // Single orderBy does NOT need a composite index — Firestore handles it automatically
    const reportsQuery = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(maxCount)
    );

    // --- SECTION: Real-Time Listener ---

    // onSnapshot fires immediately with current data, then again on every change
    const unsubscribeListener = onSnapshot(
      reportsQuery,

      // Success: convert Firestore docs to plain objects and store in state
      (snapshot) => {
        const fetchedReports = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,          // include the document ID for referencing
          ...docSnapshot.data(),       // spread all other fields (facilityName, status, etc.)
        }));
        setReports(fetchedReports);
        setIsLoading(false);
      },

      // Error: Firestore permission denied or network failure
      (firestoreError) => {
        console.error("useReports: Firestore listener error:", firestoreError);
        setError("Could not load reports. Check your connection and try refreshing.");
        setIsLoading(false);
      }
    );

    // Return the unsubscribe function — React calls this when the component unmounts
    // to stop the listener and prevent memory leaks
    return unsubscribeListener;
  }, [maxCount]);

  return { reports, isLoading, error };
}
