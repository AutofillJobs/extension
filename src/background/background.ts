chrome.runtime.onInstalled.addListener((details) => {
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
        //   fetch("https://applygoat.com/version-test/api/1.1/obj/installedUserDetails", {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //       "Authorization": "Bearer e02abfdc4f4c029b6ebecf5cd18a8c97"
        //     },
        //     body: JSON.stringify(payload),
        //   })
        //     .then((res) => {
        //       if (!res.ok) {
        //         throw new Error(`Failed to send data to Bubble. Status: ${res.status}`);
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
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
          isCareerForm: true
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
});
