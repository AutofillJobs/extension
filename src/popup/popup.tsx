import React, { useState, useEffect, useCallback } from "react";
import "./popup.css";

const Popup: React.FC = () => {
  const [isToggled, setIsToggled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Use useEffect to check localStorage and update state accordingly
  useEffect(() => {
    chrome.storage.local.get(['toggleState'], (result) => {
      if (result.toggleState !== undefined) {
        setIsToggled(result.toggleState);
      } else {
        chrome.storage.local.set({ toggleState: true });
        setIsToggled(true);
      }
    });
  }, []);

  const handleRefetchClick = useCallback(() => {
    if (!isToggled) {
      console.log('Toggle state is off. Data will not be filled.');
      return;
    }

    setIsLoading(true);
    console.log('Refetch Data button clicked');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "refetchData" }, () => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });
  }, [isToggled]);

  const toggleSwitch = useCallback(() => {
    const newState = !isToggled;
    setIsToggled(newState);
    chrome.runtime.sendMessage({ type: 'TOGGLE_STATE_CHANGED', value: newState });
  }, [isToggled]);

  const openWebsite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    chrome.tabs.create({ url: "https://autofilljobs.com/" });
  }, []);

  return (
    <div className="bg-black w-full p-8 text-white relative">
      <div className="header-container mb-8">
        <button 
          onClick={openWebsite}
          className="text-3xl font-bold text-primary cursor-pointer bg-transparent border-none p-0"
          aria-label="Open AutofillJobs website"
        >
          AutofillJobs
        </button>
        <span className="toggle-switch">
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isToggled} 
              onChange={toggleSwitch}
              aria-label="Toggle autofill functionality"
            />
            <span className="slider round"></span>
          </label>
          <span>{isToggled ? 'On' : 'Off'}</span>
        </span>
      </div>
      
      <div className="text-center flex flex-col justify-center items-center">
        <button 
          className="bg-primary flex items-center justify-center text-white py-2 px-4 rounded mb-4"
          onClick={openWebsite}
          aria-label="Edit your details on AutofillJobs website"
        >
          <svg 
            className="w-8 mr-2" 
            viewBox="0 0 64 64" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M32 8C18.75 8 8 18.75 8 32s10.75 24 24 24 24-10.75 24-24S45.25 8 32 8zm0 40c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z"/>
            <path d="M38 26h-4v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4h-4c-1.1 0-2 .9-2 2s.9 2 2 2h4v4c0 1.1.9 2 2 2s2-.9 2-2v-4h4c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
          </svg>
          <span className="text-lg font-bold">Edit Details</span>
        </button>
        
        <p className="text-gray-400 mt-4 mb-4">
          Click the extension icon or the button below to autofill your details!
        </p>
        
        <button 
          className={`bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg transition-opacity ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          onClick={handleRefetchClick}
          disabled={isLoading}
          aria-label="Fill your details in the current page"
        >
          {isLoading ? 'Filling...' : 'Fill Details'}
        </button>
      </div>
    </div>
  );
};

export default Popup;
