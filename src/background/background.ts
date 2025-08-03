chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "https://applygoat.com/autofill?utm_source=new-user"
    });
  }
});


