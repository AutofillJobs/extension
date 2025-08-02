import { useEffect } from "react";
import { FormData } from "../utils/types";
import { getUserData } from "../../utils/storageHandler";


export default function fillGreenhouseFields(data: FormData): void {
  console.log("Filling fields...");

  const labels = document.querySelectorAll("label");
  labels.forEach((label) => {
    const fieldName = label.textContent?.trim().toLowerCase() || "";
    const inputId = label.getAttribute("for");
    if (!inputId) return;
    const inputElement = document.getElementById(inputId) as HTMLInputElement | null;
    if (!inputElement) return;    
    if (fieldName.includes("first name")) {
      inputElement.value = data.data.details.firstName;
    } else if (fieldName.includes("last name")) {
      inputElement.value = data.data.details.lastName;
    } else if (fieldName.includes("email")) {
      inputElement.value = data.data.details.email;
    } else if (fieldName.includes("phone")) {
      inputElement.value = data.data.details.phoneNumber;
    } else if (fieldName.includes("website")) {
      inputElement.value = data.data.details.twitterUrl;
    } else if (fieldName.includes("linkedin")) {
      inputElement.value = data.data.details.linkedinUrl;
    } else if (fieldName.includes("github")) {
      inputElement.value = data.data.details.githubUrl;
    } else if (fieldName.includes("phone*")){      
        const inputId =  label.getAttribute("for")
        const inputEle = document.getElementById(inputId) as HTMLInputElement 
        inputEle.value = data.data.details.phoneNumber
    }
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

getUserData((userData) =>{
    if(userData){
        setTimeout(() => {
            fillGreenhouseFields(userData)
        }, 500);
    }
} )
// Run after slight delay to ensure DOM is ready
