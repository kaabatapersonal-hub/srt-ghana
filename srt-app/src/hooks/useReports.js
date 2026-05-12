// Real-time Firestore listener for /reports.
// limit(100) keeps us within the free Spark plan quota (50K reads/day).

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export function useReports(maxCount = 100) {
  const [reports, setReports]     = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(maxCount)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("useReports snapshot error:", err);
        setError("Could not load reports. Check your connection and try refreshing.");
        setIsLoading(false);
      }
    );

    return unsub;
  }, [maxCount]);

  return { reports, isLoading, error };
}
