import React, { useEffect, useState } from 'react';
import './VariablePopup.css';

const VariablePopup: React.FC = () => {
  const [variables, setVariables] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    chrome.storage.local.get('variablesFromBackend', (result) => {
      const fetchedVariables = result.variablesFromBackend || {};
      setVariables(fetchedVariables);
    });
  }, []);

  const handleVariableClick = (value: string) => {
    chrome.storage.local.set({ selectedVariable: value }, () => {
      chrome.runtime.sendMessage({ action: 'fillInput' });
    });
  };

  return (
    <div className="popup-container">
      <h1 className="popup-title">Select Variable to Fill</h1>
      <div className="button-container">
        {Object.entries(variables).map(([key, value]) => (
          <button key={key} className="variable-button" onClick={() => handleVariableClick(value)}>{key}</button>
        ))}
      </div>
    </div>
  );
};

export default VariablePopup;
