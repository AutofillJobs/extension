import React, { useState, useEffect } from 'react';
import {
  Zap,
  CheckCircle2,
  Clock,
  LayoutGrid,
  BarChart2,
  User,
} from 'lucide-react';

// Main App component for the extension popup
const App = () => {
  // State variables for the popup UI
  const [autofillEnabled, setAutofillEnabled] = useState(true);
  const [applicationsToday, setApplicationsToday] = useState(0);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [goal, setGoal] = useState(10);
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect hook to load data and toggle state on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Load toggle state from chrome storage
      chrome.storage.local.get(['toggleState'], (result) => {
        if (result.toggleState !== undefined) {
          setAutofillEnabled(result.toggleState);
        } else {
          chrome.storage.local.set({ toggleState: true });
          setAutofillEnabled(true);
        }
      });
      
      // Simulating API call delay with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Placeholder data for demonstration
      setApplicationsToday(5);
      setApplicationsTotal(123);
      setRecentApplications([
        { id: 1, title: 'Software Engineer at Google', date: 'Just now' },
        { id: 2, title: 'Product Manager at Meta', date: '5 minutes ago' },
        { id: 3, title: 'Data Scientist at Amazon', date: '1 hour ago' },
      ]);
      
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Function to handle the autofill toggle
  const handleAutofillToggle = () => {
    const newToggleState = !autofillEnabled;
    setAutofillEnabled(newToggleState);
    chrome.storage.local.set({ toggleState: newToggleState });
    chrome.runtime.sendMessage({ type: 'TOGGLE_STATE_CHANGED', value: newToggleState });
  };

  // Function to handle the "Fill Application" button click
  const handleFillApplication = () => {
    if (autofillEnabled) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "refetchData" });
      });
    }
  };

  // Function to handle the Settings button click
  const handleEditDetailsClick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("formpage.html") });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-900 text-white p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 antialiased text-slate-100 font-sans" 
         style={{
           background: 'linear-gradient(to right, #9333ea, #14b8a6)',
         }}>
      <div className="w-full max-w-sm mx-auto p-5 rounded-3xl backdrop-blur-md bg-white/10 shadow-lg border border-white/20">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {/* <img 
              src={chrome.runtime.getURL("icon.png")} 
              alt="applyGOAT" 
              className="h-7 w-7"
            /> */}
            <h1 className="text-2xl font-extrabold font-abeezee tracking-tighter text-white">applyGOAT</h1>
          </div>
          {/* Custom Toggle Switch */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white font-medium">Autofill</span>
            <div
              onClick={handleAutofillToggle}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500
                ${autofillEnabled ? 'bg-indigo-500' : 'bg-slate-600'}
              `}
            >
              <span className="sr-only">Toggle Autofill</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                  ${autofillEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              ></span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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
        </div>

        {/* Actions Section */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleFillApplication}
            disabled={!autofillEnabled}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all duration-300
              ${autofillEnabled
                ? 'bg-indigo-500 hover:bg-indigo-600 transform hover:scale-105 active:scale-95'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <Zap className="h-5 w-5 inline-block mr-2 -mt-1" />
            Fill Application
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
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/20 bg-white/5 p-4" style={{maxHeight: '150px'}}>
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
        </div>
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













// import React, { useState, useEffect } from 'react';
// import { Button } from '@shadcn/ui/components/ui/button';
// import { Switch } from '@shadcn/ui/components/ui/switch';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn/ui/components/ui/card';
// import { Badge } from '@shadcn/ui/components/ui/badge';
// import {
//   Cog,
//   FileText,
//   User,
//   Zap,
//   BarChart2,
//   ListTodo,
//   CalendarDays,
//   CheckCircle2,
//   Clock,
//   Briefcase
// } from 'lucide-react';

// // Main App component for the extension popup
// const App = () => {
//   // State variables for the popup UI
//   const [autofillEnabled, setAutofillEnabled] = useState(true);
//   const [applicationsToday, setApplicationsToday] = useState(0);
//   const [applicationsTotal, setApplicationsTotal] = useState(0);
//   const [goal, setGoal] = useState(10);
//   const [recentApplications, setRecentApplications] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   // useEffect hook to simulate data fetching on component mount
//   useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       // Simulating API call delay with a timeout
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // Placeholder data for demonstration
//       setApplicationsToday(5);
//       setApplicationsTotal(123);
//       setRecentApplications([
//         { id: 1, title: 'Software Engineer at Google', date: 'Just now' },
//         { id: 2, title: 'Product Manager at Meta', date: '5 minutes ago' },
//         { id: 3, title: 'Data Scientist at Amazon', date: '1 hour ago' },
//       ]);
      
//       setIsLoading(false);
//     };

//     fetchData();
//   }, []);

//   // Function to handle the autofill toggle
//   const handleAutofillToggle = () => {
//     setAutofillEnabled(!autofillEnabled);
//     // TODO: Add logic to save the setting to storage and send a message to the content script
//   };

//   // Function to handle the "Fill Application" button click
//   const handleFillApplication = () => {
//     // TODO: Add logic to send a message to the content script to trigger autofill
//     console.log('Filling application...');
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-full w-full bg-slate-900 text-white p-4">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
//           <p className="mt-4">Loading data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 font-sans p-4 antialiased">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-2">
//           <Briefcase className="h-6 w-6 text-indigo-400" />
//           <h1 className="text-xl font-bold tracking-tight text-white">CareerFlow</h1>
//         </div>
//         <div className="flex items-center space-x-2">
//           <span className="text-xs text-slate-400 font-medium">Autofill</span>
//           <Switch
//             checked={autofillEnabled}
//             onCheckedChange={handleAutofillToggle}
//             className="data-[state=checked]:bg-indigo-500"
//           />
//         </div>
//       </div>

//       {/* Main content area with cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//         {/* Applications Today Card */}
//         <Card className="bg-slate-900 border-slate-800 text-slate-50">
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium text-slate-400">Applications Today</CardTitle>
//             <CalendarDays className="h-4 w-4 text-slate-400" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-4xl font-bold mb-1">{applicationsToday}</div>
//             <p className="text-xs text-slate-500">Goal: {goal}</p>
//           </CardContent>
//         </Card>

//         {/* Total Applications Card */}
//         <Card className="bg-slate-900 border-slate-800 text-slate-50">
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium text-slate-400">Total Applications</CardTitle>
//             <BarChart2 className="h-4 w-4 text-slate-400" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-4xl font-bold mb-1">{applicationsTotal}</div>
//             <p className="text-xs text-slate-500">Since you started</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Actions and Quick Access */}
//       <div className="space-y-4 mb-6">
//         <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</h2>
//         <div className="grid grid-cols-2 gap-3">
//           <Button
//             onClick={handleFillApplication}
//             disabled={!autofillEnabled}
//             className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform transform hover:scale-105 active:scale-95 duration-200"
//           >
//             <Zap className="h-4 w-4 mr-2" /> Fill Application
//           </Button>
//           <Button
//             className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-lg shadow-lg transition-transform transform hover:scale-105 active:scale-95 duration-200"
//           >
//             <Cog className="h-4 w-4 mr-2" /> Settings
//           </Button>
//         </div>
//       </div>
      
//       {/* Recent Applications List */}
//       <div className="flex-1 overflow-y-auto custom-scrollbar">
//         <Card className="bg-slate-900 border-slate-800 text-slate-50 h-full">
//           <CardHeader className="flex flex-row items-center justify-between">
//             <CardTitle className="text-base font-semibold text-white">Recent Applications</CardTitle>
//             <ListTodo className="h-4 w-4 text-slate-400" />
//           </CardHeader>
//           <CardContent className="space-y-3">
//             {recentApplications.length > 0 ? (
//               recentApplications.map((app) => (
//                 <div key={app.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-b-0">
//                   <div className="flex items-center">
//                     <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
//                     <span className="text-sm font-medium truncate">{app.title}</span>
//                   </div>
//                   <Badge variant="secondary" className="bg-slate-800 text-slate-400 hover:bg-slate-700 ml-2 whitespace-nowrap">
//                     <Clock className="h-3 w-3 mr-1" />
//                     {app.date}
//                   </Badge>
//                 </div>
//               ))
//             ) : (
//               <p className="text-center text-sm text-slate-500 py-4">No applications filled yet.</p>
//             )}
//           </CardContent>
//         </Card>
//       </div>
      
//       {/* Custom scrollbar style */}
//       <style>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: #0f172a;
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #475569;
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: #64748b;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default App;












// import React, { useState, useEffect } from "react";
// import "./popup.css";

// const Popup = () => {
//   const [isToggled, setIsToggled] = useState(true);

//   useEffect(() => {
//     chrome.storage.local.get(['toggleState'], (result) => {
//       if (result.toggleState !== undefined) {
//         setIsToggled(result.toggleState);
//       } else {
//         chrome.storage.local.set({ toggleState: true });
//         setIsToggled(true);
//       }
//     });
//   }, []);

//   const handleRefetchClick = () => {
//     if (isToggled) {
//       chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, { action: "refetchData" });
//       });
//     }
//   };

//   const toggleSwitch = () => {
//     const newToggleState = !isToggled;
//     setIsToggled(newToggleState);
//     chrome.storage.local.set({ toggleState: newToggleState });
//     chrome.runtime.sendMessage({ type: 'TOGGLE_STATE_CHANGED', value: newToggleState });
//   };

//   const handleEditDetailsClick = () => {
//     chrome.tabs.create({ url: chrome.runtime.getURL("formpage.html") });
//   };

//   return (
//     <div className="w-full p-8 relative bg-white">
//       <div className="header-container mb-8">
//         <a href="https://autofilljobs.com" target="_blank" className="text-3xl font-extrabold text-primary">
//         Apply<span className="text-black">GOAT</span>
//         </a>
//         <span className="toggle-switch">
//           <label className="toggle-switch">
//             <input type="checkbox" className="toggle-input" checked={isToggled} onChange={toggleSwitch} />
//             <span className="toggle-slider"></span>
//           </label>
//           <span className="text-black">{isToggled ? 'On' : 'Off'}</span>
//         </span>
//       </div>

//       <div className="text-center flex flex-col justify-center items-center">
//         <button
//           className="btn-primary flex items-center justify-center py-2 px-4"
//           onClick={handleEditDetailsClick}
//         >
//           <span className="flex items-center text-lg font-semibold">
//             <img className="w-5 h-5 mr-2" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACeUlEQVR4nO2a3U4TQRSAB1u9setDoDWR+giK8Sf0CXgAkQsNBqIPUZcHAG5tvMDoJTyFF2AQXwGu7ZUYk8+MTJPatLIzZecMu+dLNml3s3N+MjtzzpxjjKIoiqIoiqJEAciALrA8dtl7makyQAc4ZTr22YKpKsA+F7NnqggwB/wo4IABcM1cRYBHwAugPeHZPMWZn/B+G1gFFk1qAE2gP2LAbyAHbowsfPZ/UfLhgmjHAHpuzCFWVtMkZPzuFEMOgR03rX2x72wDB1OefxR3AtAAPiDHZ1En8O+0l6IvZfwi6fBQwgGrpMOKhAPaYyuzFFaHO9EdYHHbkzTvjBTAdeCLoPGHw1hD0glbnkofARsuMbrpro67981zrG1p4zOPIOcn8Op/cb6LK9aAs4JjDkRSaM4TGxvbb3oY/9hj/CceTsidLnOx8vn9gND2ZYCs154yBk63TpnT/RR/jkLSW/c5HAfIszq2ynBAlzA2ZpD5JlDm0uVab/4qY8/tQgg+4gLuB8pcTskBrRk/uyvvgGwGmbeq4ICFqnwC3bovglngNmjD20bgNvg9QN5JKdugxU7nwEBozXgCrHvKsDrtAfdMxFA4L6icDWufeoz/DPhVcOzNaKHwjMnQmQtvGxdM+3UP42WSoVHc0bUPx25xsyt8y13299uAb37LSMJ50eIrdT0QoXg6XCY9KePv1vpQFD0WJ6XCyIPoMyCh0th7U+Pi6KcUKsRNV6qexIGLE0LL4ztuq5vEbmo9Av2xlbl3iQ0SebINEqPYKi3wHLhdUovMikglWKBJKn5iE4Nat8kVbJQ8iZLPJ9oqu1TaSY6iKIqiKIqimHH+AL2UKkksfcEMAAAAAElFTkSuQmCC"
//               alt="settings" /> Edit Details
//           </span>
//         </button>

//         <p className="text-gray-600 mt-8 mb-4">
//           Click the extension icon or the button below to autofill your details!
//         </p>

//         <button
//           className="btn-primary text-lg py-3 px-8"
//           onClick={handleRefetchClick}
//         >
//           Fill Details
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Popup;

