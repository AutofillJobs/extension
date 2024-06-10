let userEmail = '';
let lastFilledFields = null;
// const url = "http://localhost:5000/api/details/extension/filledFields" 
const url = "https://api.autofilljobs.com/details/extension/filledFields"
chrome.storage.local.get(['toggleState'], function(result) {
  console.log('Toggle state stored in local storage1:', result.toggleState);
});
chrome.identity.getProfileUserInfo(function(userInfo) {
  console.log('User Info:', userInfo);
  if (userInfo.email) {
    userEmail = userInfo.email;
    console.log('User Email:', userInfo.email);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getLoginEmail") {
    // Replace this with your logic to get the current login email ID
    console.log("here",userEmail);
    const loginEmail = "user@example.com";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("tabs",tabs);
      chrome.tabs.sendMessage(tabs[0].id, { email: userEmail });
    });
  }


  if(request.type==="TOGGLE_STATE_CHANGED"){
    chrome.storage.local.set({ toggleState: request.value }, () => {
      console.log('Toggle state stored in local storage:', request.value);
    });
  }  
  if (request.action === 'filledFields') {
    console.log('Received filled fields:', request.data);
    lastFilledFields = request.data; // Save the filled fields
  }

    // Update local content script state or functionality based on this
  
});

// background.ts

let lastRequestTabId: number | null = null;
let lastRequestTime: number | null = null;
let lastRequestUrl: string | null = null;
let lastHostname = null;

// Listen for POST requests
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.method === 'POST' && details.statusCode === 200) {
      console.log('Detected POST request with status 200:', details);
      lastRequestTabId = details.tabId;
      lastRequestTime = Date.now();
      // Get the current URL before the POST request
      chrome.tabs.get(details.tabId, (tab) => {
        if (tab.url) {
          lastRequestUrl = tab.url;
          lastHostname = new URL(tab.url).hostname;
          console.log('Hostname:', lastHostname); 
          console.log('URL before POST request:', lastRequestUrl); // Log the URL before the POST request
          chrome.runtime.sendMessage({ action: 'logUrl', url: lastRequestUrl, type: 'beforePost' });
        }
      });
    }
  },
  { urls: ['<all_urls>'] }
);

// Listen for tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tabId === lastRequestTabId && lastRequestTime && (Date.now() - lastRequestTime < 5000)) {
    console.log('URL changed after POST request:', changeInfo.url);
    console.log('Previous URL:', lastRequestUrl); // Log the URL before the POST request
    // Notify content script or perform other actions

    if (lastFilledFields) {
      console.log('Filled fields after successful POST request:', lastFilledFields);

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          companyName: lastHostname,
          filledFields: lastFilledFields,
          
         
        }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Successfully sent filled fields to backend:', data);
      })
      .catch(error => {
        console.error('Error sending filled fields to backend:', error);
      });



      lastFilledFields = null; // Clear the stored filled fields after logging
    }

    chrome.tabs.sendMessage(tabId, { 
      action: 'urlChangedAfterPost', 
      previousUrl: lastRequestUrl, 
      newUrl: changeInfo.url 
    });
    chrome.runtime.sendMessage({ action: 'logUrl', previousUrl: lastRequestUrl, newUrl: changeInfo.url, type: 'afterPost' });
    // Reset tracking variables
    lastRequestTabId = null;
    lastRequestTime = null;
    lastRequestUrl = null;
    lastHostname = null;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'filledFields') {
    console.log('Received filled fields:', request.data);
    // Handle the received data here
  }
});














// chrome.tabs.getSelected(null, function(tab) {
//   chrome.tabs.sendRequest(tab.id, {greeting: "hello"}, function(response) {
//     console.log(response.farewell);
//   });
// });



// chrome.tabs.onActivated.addListener((tab) => {
//   console.log('tab', tab);
//   if (userEmail) {
//     setTimeout(() => {
//       chrome.tabs.sendMessage(
//         tab.tabId,
//         { userEmail: userEmail }, // Sending email as an object to the content script
//         (response) => {
//           console.log('response', response);
//         }
//       );
//     }, 2000);
//   } else {
//     console.log('User email not available yet.');
//     // Handle case where user email is not available yet
//   }
// });
