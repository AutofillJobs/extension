import React from "react";
import { createRoot } from "react-dom/client";
import './tailwind.css';
import Popup from "./popup";

function init() {
    const appContainer = document.createElement('div');

    // Add class and make background transparent
    appContainer.className = 'popup-root bg-transparent';

    document.body.appendChild(appContainer);

    if (!appContainer) {
        throw new Error("Can not find AppContainer");
    }

    const root = createRoot(appContainer);
    root.render(<Popup />);
}

init();
