// Type definitions for extension messages
interface SaveJobMessage {
  type: "saveAppliedJob";
  jobId: string;
  jobTitle: string;
  url: string;
  appliedDateTime: string;
}

interface ToggleMessage {
  type: "AUTO_CLICK_TOGGLE_CHANGED" | "TOGGLE_STATE_CHANGED";
  value: boolean;
}

type ExtensionMessage = SaveJobMessage | ToggleMessage;

chrome.runtime.onInstalled.addListener((details) => {
  console.log("🔧 Extension installed/updated:", details.reason);

  if (details.reason === "install") {
    fetch("https://ipapi.co/json/")
      .then((response) => response.json())
      .then((data) => {
        const payload = {
          country: data.country_name,
          region: data.region,
        };
        console.log("producation", process.env.NODE_ENV);

        // Only send to Bubble in production
        // if (process.env.NODE_ENV === "production") {
        //   fetch(
        //     "https://applygoat.com/version-test/api/1.1/obj/installedUserDetails",
        //     {
        //       method: "POST",
        //       headers: {
        //         "Content-Type": "application/json",
        //         Authorization: "Bearer e02abfdc4f4c029b6ebecf5cd18a8c97",
        //       },
        //       body: JSON.stringify(payload),
        //     }
        //   )
        //     .then((res) => {
        //       if (!res.ok) {
        //         throw new Error(
        //           `Failed to send data to Bubble. Status: ${res.status}`
        //         );
        //       }
        //       return res.json();
        //     })
        //     .then((bubbleResponse) => {
        //       console.log("Successfully sent to Bubble:", bubbleResponse);
        //     })
        //     .catch((err) => {
        //       console.error("Error sending to Bubble:", err);
        //     });
        // }
      })
      .catch((err) => {
        console.error("Failed to fetch location info:", err);
      });

    // Open onboarding tab regardless of env
    chrome.tabs.create({
      url: "https://applygoat.com/autofill?utm_source=new-user",
    });

    // Get email and country from stored formData
    chrome.storage.local.get(["formData"], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error accessing local storage:",
          chrome.runtime.lastError.message
        );
        return;
      }

      const formData = result.formData;
      const data =
        typeof formData === "string" ? JSON.parse(formData) : formData;

      const email = data?.data?.details?.email || "";
      const country = data?.data?.details?.country || "";

      console.log(`Email: ${email}, Country: ${country}`);

      // Build uninstall URL with URL-encoded params
      const uninstallFeedbackUrl = `https://applygoat.com/version-test/uninstall?debug_mode=true&email=${encodeURIComponent(
        email
      )}&country=${encodeURIComponent(country)}`;

      if (chrome.runtime.setUninstallURL) {
        console.log("Setting uninstall URL:", uninstallFeedbackUrl);
        chrome.runtime.setUninstallURL(uninstallFeedbackUrl);
      }
    });
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message.type === "saveAppliedJob") {
      const { jobId, jobTitle, url, appliedDateTime } = message;

      chrome.storage.local.get(["applications"], (result) => {
        const applications = result.applications || [];

        const uniqueKey = `${jobId}-${jobTitle}`;
        const alreadySaved = applications.some(
          (app: any) => `${app.jobId}-${app.jobTitle}` === uniqueKey
        );

        if (!alreadySaved) {
          applications.push({
            jobId,
            companyLink: url,
            jobTitle,
            dateApplied: appliedDateTime,
            status: "Applied",
            isCareerForm: true,
          });

          chrome.storage.local.set({ applications }, () => {
            console.log("✅ Application saved:", jobId, jobTitle);
          });
        } else {
          console.log("⚠️ Duplicate application skipped:", uniqueKey);
        }
      });

      sendResponse({ success: true });
      return true; // keep channel open for async
    }

    // Handle auto-click toggle state changes
    if (message.type === "AUTO_CLICK_TOGGLE_CHANGED") {
      console.log("Auto-click toggle state changed to:", message.value);
      // Broadcast the change to all content scripts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(
              tab.id,
              {
                type: "AUTO_CLICK_TOGGLE_UPDATE",
                autoClickEnabled: message.value,
              },
              () => {
                // Silently handle any errors (e.g., no content script in tab)
                void chrome.runtime.lastError;
              }
            );
          }
        });
      });
      sendResponse({ success: true });
      return true;
    }

    // Handle existing toggle state changes
    if (message.type === "TOGGLE_STATE_CHANGED") {
      console.log("Autofill toggle state changed to:", message.value);
      sendResponse({ success: true });
      return true;
    }
  }
);
function updateUninstallURLFromStorage() {
  chrome.storage.local.get(["formData"], (result: { formData?: any }) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error accessing local storage:",
        chrome.runtime.lastError.message
      );
      return;
    }

    const formData = result.formData;
    const data = typeof formData === "string" ? JSON.parse(formData) : formData;

    const email = data?.data?.details?.email || "";
    const country = data?.data?.details?.country || "";

    const uninstallFeedbackUrl = `https://applygoat.com/version-test/uninstall?debug_mode=true&email=${encodeURIComponent(
      email
    )}&country=${encodeURIComponent(country)}`;
    chrome.runtime.setUninstallURL(uninstallFeedbackUrl);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateUninstallURLFromStorage();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.formData) {
    updateUninstallURLFromStorage();
  }
});
