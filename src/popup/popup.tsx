import React, { useState, useEffect } from "react";
import { Zap, User } from "lucide-react";
import { syncDataFromBackend } from "../utils/storageHandler";

const App = () => {
  const analyticsUrl = `${chrome.runtime.getURL("formpage.html")}#/analytics`;
  const [autofillEnabled, setAutofillEnabled] = useState(true);
  const [jobAddedFeedback, setJobAddedFeedback] = useState(false);

  useEffect(() => {
    // Sync latest data from backend on popup open
    syncDataFromBackend();

    // Load toggle state
    chrome.storage.local.get(["toggleState"], (result) => {
      if (result.toggleState !== undefined) {
        setAutofillEnabled(result.toggleState);
      } else {
        chrome.storage.local.set({ toggleState: true });
        setAutofillEnabled(true);
      }
    });
  }, []);

  useEffect(() => {
    const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.toggleState) {
        setAutofillEnabled(Boolean(changes.toggleState.newValue));
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  const handleAutofillToggle = () => {
    const newState = !autofillEnabled;
    setAutofillEnabled(newState);
    chrome.storage.local.set({ toggleState: newState });
    chrome.runtime.sendMessage({ type: "TOGGLE_STATE_CHANGED", value: newState });
  };

  const handleFillApplication = () => {
    if (!autofillEnabled) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id !== undefined) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "refetchData" });
      }
    });
  };

  const handleEditDetailsClick = () => {
    chrome.tabs.create({ url: "https://applygoat.com/version-test/profile?mode=extension" });
  };

  const handleAddJobClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || tabs[0].id === undefined) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "SAVE_APPLICATION_MANUAL" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("[Popup] Message send error:", chrome.runtime.lastError.message);
          return;
        }
        if (response?.success) {
          setJobAddedFeedback(true);
          setTimeout(() => setJobAddedFeedback(false), 4000);
        }
      });
    });
  };

  const handleScanCVClick = () => {
    chrome.tabs.create({ url: "https://applygoat.com/dashboard" });
  };

  return (
    <div
      className="flex flex-col h-full w-full p-4 antialiased text-slate-100 font-sans"
      style={{ background: "linear-gradient(to right, #9333ea, #14b8a6)" }}
    >
      <div className="w-full max-w-sm mx-auto p-5 rounded-3xl backdrop-blur-md bg-white/10 shadow-lg border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1
            onClick={() => window.open("https://applygoat.com/autofill-job-applications", "_blank")}
            className="text-2xl font-extrabold font-abeezee tracking-tighter text-white cursor-pointer hover:text-amber-300 transition-colors duration-200"
            title="Visit applyGOAT website"
          >
            applyGOAT
          </h1>

          {/* Autofill Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-white font-medium">Autofill</span>
            <div
              onClick={handleAutofillToggle}
              className={`relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200
                ${autofillEnabled ? "bg-indigo-500" : "bg-slate-600"}`}
            >
              <span className="sr-only">Toggle Autofill</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                  ${autofillEnabled ? "translate-x-4" : "translate-x-0"}`}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleFillApplication}
            disabled={!autofillEnabled}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all duration-300
              ${autofillEnabled
                ? "bg-indigo-500 hover:bg-indigo-600 transform hover:scale-105 active:scale-95"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"}`}
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
              ✓ Job added –{" "}
              <a href={analyticsUrl} target="_blank" className="underline hover:text-amber-300">
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
      </div>
    </div>
  );
};

export default App;
