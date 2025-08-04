import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "./Dashboard";
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
    root.render(<Dashboard />);
}

init();
