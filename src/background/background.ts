let userEmail = '';
let lastFilledFields = null;

chrome.storage.local.get(['toggleState'], function(result) {
  console.log('Toggle state stored in local storage1:', result.toggleState);
});



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_USER_EMAIL') {
    console.log(userEmail);
      sendResponse({ email: userEmail });
    return true; // Keep the message channel open for sendResponse
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

    // if (lastFilledFields) {
    //   console.log('Filled fields after successful POST request:', lastFilledFields);

    //   fetch(url, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       email: userEmail,
    //       companyName: lastHostname,
    //       filledFields: lastFilledFields,
          
         
    //     }),
    //   })
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log('Successfully sent filled fields to backend:', data);
    //   })
    //   .catch(error => {
    //     console.error('Error sending filled fields to backend:', error);
    //   });



    //   lastFilledFields = null; // Clear the stored filled fields after logging
    // }

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
      { id: 'fullName', title: 'Full Name' },
      { id: 'firstName', title: 'First Name' },
      { id: 'middleName', title: 'Middle Name' },
      { id: 'lastName', title: 'Last Name' },
      { id: 'familyName', title: 'Family Name' },
      { id: 'preferredName', title: 'Preferred Name' },
      { id: 'maritalStatus', title: 'Marital Status' },
      { id: 'gender', title: 'Gender' },
      { id: 'prefix', title: 'Prefix' },
      { id: 'DoB', title: 'DoB' },
      { id: 'phoneNumber', title: 'Contact Number' },
      { id: 'phoneAlternativeNumber', title: 'Alternative Contact Number' }
  ];

  personalItems.forEach(item => {
      chrome.contextMenus.create({
          id: item.id,
          title: item.title,
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
      { id: 'address1', title: 'Address Line 1' },
      { id: 'address2', title: 'Address Line 2' },
      { id: 'apartment', title: 'Apartment' },
      { id: 'building', title: 'Building' },
      { id: 'floor', title: 'Floor' },
      { id: 'street', title: 'Street' },
      { id: 'city', title: 'City' },
      { id: 'state', title: 'State/Province' },
      { id: 'country', title: 'Country' },
      { id: 'nationality', title: 'Nationality' },
      { id: 'zip', title: 'Zip/Postal Code' }
  ];

  addressItems.forEach(item => {
      chrome.contextMenus.create({
          id: item.id,
          title: item.title,
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
      { id: 'userName', title: 'User Name' },
      { id: 'password', title: 'Password' },
      { id: 'linkedinUrl', title: 'LinkedIn URL' },
      { id: 'githubUrl', title: 'GitHub URL' },
      { id: 'twitterUrl', title: 'Twitter URL' },
      { id: 'email', title: 'Email ID' },
      { id: 'emailAlternative', title: 'Alternative Email ID' },
      { id: 'workedPreviously', title: 'Worked Previously' },
      { id: 'expectedSalary', title: 'Expected Salary' },
      { id: 'grossSalary', title: 'Gross Salary' },
      { id: 'noticePeriod', title: 'Notice Period' }
  ];

  credentialsItems.forEach(item => {
      chrome.contextMenus.create({
          id: item.id,
          title: item.title,
          parentId: 'credentials',
          contexts: ['editable']
      });
  });
}



// Handle click events


// Create the context menu when the extension is installed or updated
chrome.runtime.onInstalled.addListener(createContextMenu);

