export function promptUserToUploadResume() {
  // 1. Show a popup or alert
  alert("Please upload your resume manually using the file input below.");

  // 2. Optionally, open the file picker for the user
  const fileInput = document.querySelector<HTMLInputElement>(
    "input[type='file'][id$='AttachedFilesBlock-uploadedFile']"
  );
  if (fileInput) {
    fileInput.click();
    // Optionally, highlight the input for the user
    fileInput.style.outline = "2px solid #007bff";
    setTimeout(() => {
      fileInput.style.outline = "";
    }, 3000);
  } else {
    console.warn("[fileHandler] Resume file input not found.");
  }
}