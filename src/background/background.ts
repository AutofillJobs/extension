let userEmail = '';

chrome.identity.getProfileUserInfo(function(userInfo) {
  console.log('User Info:', userInfo);
  if (userInfo.email) {
    userEmail = userInfo.email;
    console.log('User Email:', userInfo.email);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("received message",request.message)
  if (request.message === "getLoginEmail") {
    // Replace this with your logic to get the current login email ID
    console.log("here",userEmail);
    const loginEmail = "user@example.com";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("tabs",tabs);
      chrome.tabs.sendMessage(tabs[0].id, { email: userEmail });
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
