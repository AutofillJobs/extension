import React, { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle2,
  Clock,
  LayoutGrid,
  BarChart2,
  User,
} from "lucide-react";

import { syncDataFromBackend } from "../utils/storageHandler";

// Define interface for recent applications
interface RecentApplication {
  id: number;
  title: string;
  date: string;
}

// Main App component for the extension popup

const App = () => {
  const analyticsUrl = `${chrome.runtime.getURL("formpage.html")}#/analytics`;
  // State variables for the popup UI
  const [autofillEnabled, setAutofillEnabled] = useState(true);
  const [autoClickEnabled, setAutoClickEnabled] = useState(false);
  const [applicationsToday, setApplicationsToday] = useState(0);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [jobAddedFeedback, setJobAddedFeedback] = useState(false);
  const [goal, setGoal] = useState(10);
  const [recentApplications, setRecentApplications] = useState<
    RecentApplication[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect hook to load data and toggle state on component mount
  useEffect(() => {
    const fetchData = async () => {
      console.log("SYNC: Starting sync from Bubble backend...");
      await syncDataFromBackend();
      console.log("SYNC: Sync finished.");
      // Load toggle state from chrome storage
      chrome.storage.local.get(
        ["toggleState", "autoClickToggleState", "formData"],
        (result) => {
          console.log("[Popup] Loading toggle states from storage:", result);

          if (result.toggleState !== undefined) {
            console.log("[Popup] Setting autofill to:", result.toggleState);
            setAutofillEnabled(result.toggleState);
          } else {
            console.log("[Popup] No autofill state found, defaulting to true");
            chrome.storage.local.set({ toggleState: true });
            setAutofillEnabled(true);
          }

          // Force auto-click disabled regardless of stored value
          chrome.storage.local.set({ autoClickToggleState: false });
          setAutoClickEnabled(false);

          console.log(
            "[Popup] Final states - Autofill:",
            result.toggleState !== undefined ? result.toggleState : true,
            "Auto-click:",
            result.autoClickToggleState !== undefined
              ? result.autoClickToggleState
              : true
          );

          if (result.formData) {
            console.log(" TEST: Data found in 'formData':", result.formData);
          } else {
            console.error(" TEST: No 'formData' key found in storage.");
          }
        }
      );
      // Placeholder data for demonstration
      setApplicationsToday(5);
      setApplicationsTotal(123);
      setRecentApplications([
        { id: 1, title: "Software Engineer at Google", date: "Just now" },
        { id: 2, title: "Product Manager at Meta", date: "5 minutes ago" },
        { id: 3, title: "Data Scientist at Amazon", date: "1 hour ago" },
      ]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.formData) {
        console.log("[Popup] formData updated:", changes.formData.newValue);
      }
      if (changes.toggleState) {
        setAutofillEnabled(Boolean(changes.toggleState.newValue));
      }
      if (changes.autoClickToggleState) {
        setAutoClickEnabled(Boolean(changes.autoClickToggleState.newValue));
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  // Function to handle the autofill toggle
  const handleAutofillToggle = () => {
    const newToggleState = !autofillEnabled;
    console.log(
      "[Popup] Autofill toggle clicked - changing from",
      autofillEnabled,
      "to",
      newToggleState
    );
    setAutofillEnabled(newToggleState);
    chrome.storage.local.set({ toggleState: newToggleState }, () => {
      console.log("[Popup] Autofill toggle saved to storage:", newToggleState);
    });
    chrome.runtime.sendMessage({
      type: "TOGGLE_STATE_CHANGED",
      value: newToggleState,
    });
    console.log("[Popup] Autofill toggle message sent to background");
  };

  // Function to handle the auto-click toggle
  const handleAutoClickToggle = () => {
    console.log("[Popup] Auto-click is disabled by configuration");
    chrome.storage.local.set({ autoClickToggleState: false });
    setAutoClickEnabled(false);
  };

  // Function to handle the "Fill Application" button click
  const handleFillApplication = () => {
    if (autofillEnabled) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].id !== undefined) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "refetchData" });
        } else {
          console.error("No active tab found or tab ID is undefined");
        }
      });
    }
  };

  // Function to handle the Settings button click
  const handleEditDetailsClick = () => {
    // chrome.tabs.create({ url: chrome.runtime.getURL("formpage.html") }); // old url that open the formpage in extension itself
    chrome.tabs.create({ url: "https://applygoat.com/version-test/profile?mode=extension" });
  };

  // Function to handle Add Job to Analytics click
  const handleAddJobClick = () => {
    console.log("[Popup] 🎯 Add Job to Analytics button clicked");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || tabs[0].id === undefined) {
        console.error("[Popup] ❌ No active tab found");
        return;
      }
      console.log("[Popup] 📋 Active tab:", tabs[0].title, tabs[0].url);
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "SAVE_APPLICATION_MANUAL" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "[Popup] ❌ Message send error:",
              chrome.runtime.lastError.message
            );
          } else {
            console.log("[Popup] ✅ Save application response:", response);
            setJobAddedFeedback(true);
            setTimeout(() => setJobAddedFeedback(false), 4000);
          }
        }
      );
    });
  };

  // Function to handle Scan CV button click
  const handleScanCVClick = () => {
    chrome.tabs.create({ url: "https://applygoat.com/dashboard" });
  };

  if (isLoading) {
    // Instantly render UI, no loading state
  }

  return (
    <div
      className="flex flex-col h-full w-full p-4 antialiased text-slate-100 font-sans"
      style={{
        background: "linear-gradient(to right, #9333ea, #14b8a6)",
      }}
    >
      <div className="w-full max-w-sm mx-auto p-5 rounded-3xl backdrop-blur-md bg-white/10 shadow-lg border border-white/20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {/* <img 
              src={chrome.runtime.getURL("icon.png")} 
              alt="applyGOAT" 
              className="h-7 w-7"
            /> */}
            <h1
              onClick={() =>
                window.open(
                  "https://applygoat.com/autofill-job-applications",
                  "_blank"
                )
              }
              className="text-2xl font-extrabold font-abeezee tracking-tighter text-white cursor-pointer hover:text-amber-300 transition-colors duration-200"
              title="Visit applyGOAT website"
            >
              applyGOAT
            </h1>
          </div>
          {/* Toggle Switches Container */}
          <div className="flex flex-col items-end space-y-2">
            {/* Autofill Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-white font-medium">Autofill</span>
              <div
                onClick={handleAutofillToggle}
                className={`relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500
                  ${autofillEnabled ? "bg-indigo-500" : "bg-slate-600"}
                `}
              >
                <span className="sr-only">Toggle Autofill</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                    ${autofillEnabled ? "translate-x-4" : "translate-x-0"}
                  `}
                ></span>
              </div>
            </div>
            {/* Auto-Click Toggle */}
            {/* <div className="flex items-center space-x-2">
              <span className="text-xs text-white font-medium">
                Auto-Click Next
              </span>
              <div
                onClick={handleAutoClickToggle}
                className={`relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500
                  ${autoClickEnabled ? "bg-green-500" : "bg-slate-600"}
                `}
              >
                <span className="sr-only">Toggle Auto-Click</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                    ${autoClickEnabled ? "translate-x-4" : "translate-x-0"}
                  `}
                ></span>
              </div>
            </div> */}
          </div>
        </div>

        {/* Stats Section */}
        {/* <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-white/20 bg-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <LayoutGrid className="h-5 w-5 text-indigo-300" />
              <p className="text-xs font-semibold text-indigo-300">Today</p>
            </div>
            <div className="text-3xl font-bold tracking-tight text-white mb-0.5">{applicationsToday}</div>
            <p className="text-xs text-slate-300">Goal: {goal}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/20 bg-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <BarChart2 className="h-5 w-5 text-purple-300" />
              <p className="text-xs font-semibold text-purple-300">Total</p>
            </div>
            <div className="text-3xl font-bold tracking-tight text-white mb-0.5">{applicationsTotal}</div>
            <p className="text-xs text-slate-300">Lifetime count</p>
          </div>
        </div> */}

        {/* Actions Section */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleFillApplication}
            disabled={!autofillEnabled}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all duration-300
              ${
                autofillEnabled
                  ? "bg-indigo-500 hover:bg-indigo-600 transform hover:scale-105 active:scale-95"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }
            `}
          >
            <Zap className="h-5 w-5 inline-block mr-2 -mt-1" />
            Fill Application
          </button>
          <button
            onClick={handleAddJobClick}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Add Job to Analytics
          </button>
          {jobAddedFeedback && (
            <div className="text-center text-sm text-white mt-1">
              ✓ Job added to analytics –
              <a
                href={analyticsUrl}
                target="_blank"
                className="underline ml-1 hover:text-amber-300"
              >
                view dashboard
              </a>
            </div>
          )}

          <button
            onClick={handleScanCVClick}
            className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium shadow-md transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Enhance Your CV & Cover Letter
          </button>
          <button
            onClick={handleEditDetailsClick}
            className="w-full py-3 px-4 rounded-xl bg-white/10 text-white font-medium shadow-md transition-all duration-300 transform hover:scale-105 active:scale-95 hover:bg-white/20 border border-white/20"
          >
            <User className="h-5 w-5 inline-block mr-2 -mt-1" />
            Profile
          </button>
        </div>

        {/* Recent Applications List */}
        {/* <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/20 bg-white/5 p-4" style={{maxHeight: '150px'}}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Recent Fills</h2>
          {recentApplications.length > 0 ? (
            <ul className="space-y-2">
              {recentApplications.map((app) => (
                <li key={app.id} className="flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:bg-white/10">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium truncate text-white">{app.title}</span>
                  </div>
                  <div className="flex items-center text-xs text-slate-300 ml-2 whitespace-nowrap">
                    <Clock className="h-3 w-3 mr-1" />
                    {app.date}
                  </div>
                </li>
              ))
            }
            </ul>
          ) : (
            <p className="text-center text-sm text-slate-400 py-4">No applications filled yet.</p>
          )}
        </div> */}
      </div>

      {/* Custom scrollbar style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;