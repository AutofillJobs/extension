export async function uploadFile(inputSelector: string, blobStorageUrl: string, fileName: string) {
    try {
      const response = await fetch(blobStorageUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });
  
      if (!response.ok) {
        throw new Error(`Network response was not ok ${response.statusText}`);
      }
  
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      const dt = new DataTransfer();
      dt.items.add(file);
  
      const inputElement = document.querySelector(inputSelector) as HTMLInputElement;
      if (!inputElement) {
        throw new Error("File input element not found");
      }
  
      inputElement.files = dt.files;
      const event = new Event("change", { bubbles: true });
      inputElement.dispatchEvent(event);
  
      console.log("File upload successful");
    } catch (error) {
      console.error("File upload failed:", error);
    }
  }
  
  export async function fillResume() {
    try {
      chrome.storage.local.get(['resumeBase64'], async (result: { resumeBase64?: string }) => {
        if (result.resumeBase64) {
          const resumeUrl = `data:application/pdf;base64,${result.resumeBase64}`;
          await uploadFile('input[type="file"][name="resume"]', resumeUrl, 'resume.pdf');
        } else {
          console.error("Resume Base64 string not found in storage");
        }
      });
    } catch (error) {
      console.error("Error in fillResume:", error);
    }
  }
  
  export async function fillCV() {
    try {
      chrome.storage.local.get(['cvBase64'], async (result: { cvBase64?: string }) => {
        if (result.cvBase64) {
          const cvUrl = `data:application/pdf;base64,${result.cvBase64}`;
          await uploadFile('input[type="file"][name="cv"]', cvUrl, 'cv.pdf');
        } else {
          console.error("CV Base64 string not found in storage");
        }
      });
    } catch (error) {
      console.error("Error in fillCV:", error);
    }
  }