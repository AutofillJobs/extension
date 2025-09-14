import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import AnalyticsPage from "./Ananlytics/ AnalyticsPage";
import './tailwind.css';
import './index.css';

function init() {

    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    document.body.appendChild(appContainer);

    if (!appContainer) {
        throw new Error("Cannot find AppContainer");
    }

    const root = createRoot(appContainer);
    root.render(
        <HashRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
        </HashRouter>
    );
}

init();
