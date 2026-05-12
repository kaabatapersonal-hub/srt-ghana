import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { submitReport } from "../services/reportService";

const QUEUE_KEY = "srt_offline_queue";

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToOfflineQueue(reportData, userInfo) {
  const queue = getOfflineQueue();
  queue.push({ reportData, userInfo, queuedAt: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function useOfflineSync() {
  const { currentUser } = useAuth();

  useEffect(() => {
    async function flushQueue() {
      if (!currentUser) return;
      const queue = getOfflineQueue();
      if (queue.length === 0) return;

      const failed = [];
      for (const item of queue) {
        try {
          const user = {
            uid:         item.userInfo.uid,
            displayName: item.userInfo.displayName,
            email:       item.userInfo.email,
          };
          await submitReport(item.reportData, user);
        } catch {
          failed.push(item);
        }
      }

      if (failed.length === 0) {
        clearOfflineQueue();
      } else {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
      }
    }

    window.addEventListener("online", flushQueue);

    // also try on mount in case we came back online between sessions
    if (navigator.onLine) flushQueue();

    return () => window.removeEventListener("online", flushQueue);
  }, [currentUser]);
}
