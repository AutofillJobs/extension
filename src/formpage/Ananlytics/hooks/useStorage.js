var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState } from 'react';
const STORAGE_KEY = 'applications';
const statusOptions = ["Applied", "Screen", "Interviewing", "Offer", "Rejected", "Archived"];
function useStorage() {
    const [apps, setApps] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, monthly: 0 });
    useEffect(() => {
        loadApps();
    }, []);
    useEffect(() => {
        updateStats();
        saveApps();
    }, [apps]);
    const loadApps = () => __awaiter(this, void 0, void 0, function* () {
        const result = yield chrome.storage.local.get([STORAGE_KEY]);
        const storedApps = result[STORAGE_KEY] || [];
        setApps(storedApps);
    });
    const saveApps = () => {
        chrome.storage.local.set({ [STORAGE_KEY]: apps });
    };
    const updateAppStatus = (index, newStatus) => {
        const updated = [...apps];
        updated[index].status = newStatus;
        setApps(updated);
    };
    const addNewApp = (newApp) => {
        setApps(prev => [...prev, newApp]);
    };
    const mergeAppsFromJson = (file) => __awaiter(this, void 0, void 0, function* () {
        try {
            const json = yield file.text();
            const parsed = JSON.parse(json);
            if (!parsed.applications || !Array.isArray(parsed.applications)) {
                throw new Error("Invalid JSON: missing 'applications' array");
            }
            const normalizedApps = parsed.applications.map((app) => (Object.assign(Object.assign({}, app), { status: statusOptions.includes(app.status) ? app.status : "Applied" })));
            const merged = [...apps];
            normalizedApps.forEach((newApp) => {
                const exists = apps.some((app) => app.jobTitle === newApp.jobTitle &&
                    app.companyLink === newApp.companyLink &&
                    app.dateApplied === newApp.dateApplied);
                if (!exists)
                    merged.push(newApp);
            });
            setApps(merged);
        }
        catch (err) {
            alert(err.message);
        }
    });
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
