import React, { useState, useEffect } from "react";

const Options = () => {
  const [autofillEnabled, setAutofillEnabled] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["toggleState"], (result) => {
      if (result.toggleState !== undefined) {
        setAutofillEnabled(result.toggleState);
      }
    });
  }, []);

  const save = () => {
    chrome.storage.local.set({ toggleState: autofillEnabled }, () => {
      chrome.runtime.sendMessage({ type: "TOGGLE_STATE_CHANGED", value: autofillEnabled });
      setSavedMessage("Settings saved!");
      setTimeout(() => setSavedMessage(""), 2000);
    });
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "24px", maxWidth: "480px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "24px" }}>
        applyGOAT — Extension Settings
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={autofillEnabled}
            onChange={(e) => setAutofillEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px" }}
          />
          <span style={{ fontSize: "15px" }}>Enable autofill on job application pages</span>
        </label>
        <p style={{ color: "#666", fontSize: "13px", marginTop: "6px", marginLeft: "30px" }}>
          When enabled, the extension will automatically fill form fields when you visit a
          supported job application page.
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", color: "#444" }}>
          <strong>Supported job portals:</strong> Workday, Greenhouse, ICIMS, Zoho, SuccessFactors,
          Lever, SmartRecruiters, LinkedIn Easy Apply, Indeed, Oracle, and generic job forms.
        </p>
      </div>

      <button
        onClick={save}
        style={{
          padding: "10px 24px",
          backgroundColor: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        Save Settings
      </button>

      {savedMessage && (
        <span style={{ marginLeft: "12px", color: "green", fontSize: "14px" }}>
          {savedMessage}
        </span>
      )}

      <div style={{ marginTop: "32px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "8px" }}>Quick Links</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ marginBottom: "8px" }}>
            <a href="https://applygoat.com/version-test/profile?mode=extension" target="_blank"
              style={{ color: "#6366f1", textDecoration: "none" }}>
              ✏️ Edit your profile
            </a>
          </li>
          <li style={{ marginBottom: "8px" }}>
            <a href="https://applygoat.com/dashboard" target="_blank"
              style={{ color: "#6366f1", textDecoration: "none" }}>
              📊 View analytics dashboard
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Options;
