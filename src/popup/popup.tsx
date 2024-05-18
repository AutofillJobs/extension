import React, { useState, useEffect } from "react";
import "./popup.css";
console.log("Hii");
const Popup = () => {
  const [isToggled, setIsToggled] = useState(true);

  // Use useEffect to check localStorage and update state accordingly
  useEffect(() => {
    chrome.storage.local.get(['toggleState'], (result) => {
      if (result.toggleState !== undefined) {
        setIsToggled(result.toggleState);
      }
    });
  }, []); // Default to false if not loaded from storage

  const handleRefetchClick = () => {
    console.log('Refetch Data button clicked');
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "refetchData" });
    });
  };

  const toggleSwitch = () => {
    setIsToggled(!isToggled);
    chrome.runtime.sendMessage({ type: 'TOGGLE_STATE_CHANGED', value: !isToggled });
  };

  return (
    <div className="bg-black w-full p-8 text-white relative">
      <div className="header-container mb-8">
        <a href="https://autofilljobs.com" target="_blank" className="text-3xl font-bold text-[#00df9a] cursor-pointer">
          AutofillJobs
        </a>
        <span className="toggle-switch">
          <label className="switch">
            <input type="checkbox" checked={isToggled} onChange={toggleSwitch} />
            <span className="slider round"></span>
            
          </label>
          <span>{isToggled ? 'On' : 'Off'}</span>
          
        </span>
      </div>
      <div className="text-center flex flex-col justify-center items-center">
        <button className="bg-[#00df9a] flex items-center justify-center text-white py-2 px-4 rounded">
          <a href="https://autofilljobs.com/" target="_blank" className="flex items-center text-lg font-bold text-white cursor-pointer">
            <img className="w-8"
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACeUlEQVR4nO2a3U4TQRSAB1u9setDoDWR+giK8Sf0CXgAkQsNBqIPUZcHAG5tvMDoJTyFF2AQXwGu7ZUYk8+MTJPatLIzZecMu+dLNml3s3N+MjtzzpxjjKIoiqIoiqJEAciALrA8dtl7makyQAc4ZTr22YKpKsA+F7NnqggwB/wo4IABcM1cRYBHwAugPeHZPMWZn/B+G1gFFk1qAE2gP2LAbyAHbowsfPZ/UfLhgmjHAHpuzCFWVtMkZPzuFEMOgR03rX2x72wDB1OefxR3AtAAPiDHZ1En8O+0l6IvZfwi6fBQwgGrpMOKhAPaYyuzFFaHO9EdYHHbkzTvjBTAdeCLoPGHw1hD0glbnkofARsuMbrpro67981zrG1p4zOPIOcn8Op/cb6LK9aAs4JjDkRSaM4TGxvbb3oY/9hj/CceTsidLnOx8vn9gND2ZYCs154yBk63TpnT/RR/jkLSW/c5HAfIszq2ynBAlzA2ZpD5JlDm0uVab/4qY8/tQgg+4gLuB8pcTskBrRk/uyvvgGwGmbeq4ICFqnwC3bovglngNmjD20bgNvg9QN5JKdugxU7nwEBozXgCrHvKsDrtAfdMxFA4L6icDWufeoz/DPhVcOzNaKHwjMnQmQtvGxdM+3UP42WSoVHc0bUPx25xsyt8y13299uAb37LSMJ50eIrdT0QoXg6XCY9KePv1vpQFD0WJ6XCyIPoMyCh0th7U+Pi6KcUKsRNV6qexIGLE0LL4ztuq5vEbmo9Av2xlbl3iQ0SebINEqPYKi3wHLhdUovMikglWKBJKn5iE4Nat8kVbJQ8iZLPJ9oqu1TaSY6iKIqiKIqimHH+AL2UKkksfcEMAAAAAElFTkSuQmCC"
              alt="setting" /> Edit Details
          </a>
        </button>
        <p className="text-gray-400 mt-8 mb-4">
          Click the extension icon or the button below to autofill your details!
        </p>
        <button className="bg-[#00df9a] text-white font-bold py-3 px-8 rounded-lg text-lg" onClick={handleRefetchClick}>
          Fill Details
        </button>
      </div>
    </div>
  );
};

export default Popup;
