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

chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == "update") {
    var thisVersion = chrome.runtime.getManifest().version;
    console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
    
    // Notify users about the update
    chrome.notifications.create('', {
      type: 'basic',
      title: 'Extension Updated',
      message: 'Your extension was updated successfully.',
      iconUrl: 'https://www.gstatic.com/webp/gallery/4.sm.jpg'
    });

    // Redirect to a specific URL upon update
    chrome.tabs.create({ url: 'https://chromewebstore.google.com/detail/autofilljobs/naoicaidphmpfebbgmeoflipdnkcfjck' });
  }
});


// background.js

// Function to create the context menu
function createContextMenu() {
  // Parent menu item
  chrome.contextMenus.create({
      id: 'fillThis',
      title: 'Fill This',
      contexts: ['editable']
  });

  // Personal sub-menu
  chrome.contextMenus.create({
      id: 'personal',
      title: 'Personal',
      parentId: 'fillThis',
      contexts: ['editable']
  });

  const personalItems = [
      'Full Name', 'First Name', 'Middle Name', 'Last Name', 'Family Name', 
      'Preferred Name', 'Marital Status', 'Gender', 'Prefix', 'DoB', 
      'Contact Number', 'Alternative Contact Number'
  ];

  personalItems.forEach(item => {
      chrome.contextMenus.create({
          id: item.replace(/\s+/g, ''),
          title: item,
          parentId: 'personal',
          contexts: ['editable']
      });
  });

  // Address sub-menu
  chrome.contextMenus.create({
      id: 'address',
      title: 'Address',
      parentId: 'fillThis',
      contexts: ['editable']
  });

  const addressItems = [
      'Address Line 1', 'Address Line 2', 'Apartment', 'Building', 'Floor', 
      'Street', 'City', 'State/Province', 'Country', 'Nationality', 
      'Zip/Postal Code'
  ];

  addressItems.forEach(item => {
      chrome.contextMenus.create({
          id: item.replace(/\s+/g, ''),
          title: item,
          parentId: 'address',
          contexts: ['editable']
      });
  });

  // Credentials sub-menu
  chrome.contextMenus.create({
      id: 'credentials',
      title: 'Credentials',
      parentId: 'fillThis',
      contexts: ['editable']
  });

  const credentialsItems = [
      'User Name', 'Password', 'LinkedIn URL', 'GitHub URL', 'Twitter URL', 
      'Email ID', 'Alternative Email ID', 'Worked Previously', 'Expected Salary', 
      'Gross Salary', 'Notice Period'
  ];

  credentialsItems.forEach(item => {
      chrome.contextMenus.create({
          id: item.replace(/\s+/g, ''),
          title: item,
          parentId: 'credentials',
          contexts: ['editable']
      });
  });
}

// Handle click events


// Create the context menu when the extension is installed or updated
chrome.runtime.onInstalled.addListener(createContextMenu);




chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.parentMenuItemId === "personal" || info.parentMenuItemId === "address" || info.parentMenuItemId === "credentials") {
      // Store the tab information in storage
      console.log(info.menuItemId);
      chrome.storage.local.set({ originalTabId: tab?.id });

      // Simulate fetching variables from backend
      const url = "https://api.autofilljobs.com/details/extension/" + userEmail;
      fetch(url, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
        },
      })
      .then((response) => {
          if (!response.ok) {
              throw new Error("Network response was not ok");
          }
          return response.json();
      })
      .then((data) => {
          if (data.error !== "no error") {
              console.log("Please Register in Website");
          } else {
              const variablesFromBackend = data.data.details;
              // Store variables in storage
              chrome.storage.local.set({ variablesFromBackend }, () => {
                  chrome.tabs.sendMessage(tab.id, {
                      type: 'fillField',
                      field: info.menuItemId
                  });
              });
          }
      })
      .catch((error) => {
          console.error("Error fetching data from the backend", error);
          console.log("Server Down");
      });
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
