import { useEffect, useState } from 'react';

const STORAGE_KEY = 'applications';
const statusOptions = ["Applied", "Screen", "Interviewing", "Offer", "Rejected", "Archived"];

interface Application {
  jobTitle: string;
  companyLink: string;
  jobLink?: string;
  status: string;
  dateApplied: string;
}

interface Stats {
  total: number;
  today: number;
  monthly: number;
}

function useStorage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, monthly: 0 });

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    updateStats();
    saveApps();
  }, [apps]);

  const loadApps = async () => {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const storedApps = result[STORAGE_KEY] || [];
    setApps(storedApps);
  };

  const saveApps = () => {
    chrome.storage.local.set({ [STORAGE_KEY]: apps });
  };

  const updateAppStatus = (index: number, newStatus: string) => {
    const updated = [...apps];
    updated[index].status = newStatus;
    setApps(updated);
  };

  const addNewApp = (newApp: Application) => {
    setApps(prev => [...prev, newApp]);
  };

  const mergeAppsFromJson = async (file: File) => {
    try {
      const json = await file.text();
      const parsed = JSON.parse(json);
      if (!parsed.applications || !Array.isArray(parsed.applications)) {
        throw new Error("Invalid JSON: missing 'applications' array");
      }
      const normalizedApps = parsed.applications.map((app: any) => ({
        ...app,
        status: statusOptions.includes(app.status) ? app.status : "Applied"
      }));
      const merged = [...apps];
    normalizedApps.forEach((newApp: Application) => {
      const exists: boolean = apps.some((app: Application) =>
        app.jobTitle === newApp.jobTitle &&
        app.companyLink === newApp.companyLink &&
        app.dateApplied === newApp.dateApplied
      );
      if (!exists) merged.push(newApp);
    });
      setApps(merged);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const updateStats = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const date30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = apps.filter(app => app.dateApplied === todayStr).length;
    const monthly = apps.filter(app => app.dateApplied >= date30DaysAgo).length;
    setStats({ total: apps.length, today, monthly });
  };

  return {
    apps,
    setApps,
    updateAppStatus,
    addNewApp,
    mergeAppsFromJson,
    stats,
    reload: loadApps
  };
}

export default useStorage;
