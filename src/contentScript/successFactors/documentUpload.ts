// src/contentScript/successFactors/documentUpload.ts

import { uploadFile } from '../autoFormFill/fileUploader';

/**
 * Upload resume to SuccessFactors application.
 * Looks for 'resumeBase64' in chrome.storage.local.
 */
export async function uploadResumeToSuccessFactors() {
  try {
    chrome.storage.local.get(['resumeBase64'], async (result: { resumeBase64?: string }) => {
      if (result.resumeBase64) {
        // Convert the stored Base64 string to a Data URL
        const resumeUrl = `data:application/pdf;base64,${result.resumeBase64}`;

        // Update this selector if the input element's name or type changes on the page
        const fileInputSelector = 'input[type="file"][name="resume"]';

        console.log('Uploading resume to SuccessFactors...');
        await uploadFile(fileInputSelector, resumeUrl, 'resume.pdf');
      } else {
        console.error('No resumeBase64 found in chrome.storage.local');
      }
    });
  } catch (error) {
    console.error('Error in uploadResumeToSuccessFactors:', error);
  }
}
