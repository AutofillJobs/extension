import React, { useState, useEffect, useCallback } from "react";
import "./formpage.css";
import FormSteps from "./components/FormSteps";
import {
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";
import { downloadJSON, uploadJSON } from "./components/JsonImportExport";
import {
  saveUserData,
  saveFileData,
  getUserData,
  getFileData,
} from "../utils/storageHandler";

const INITIAL_FORM_DATA = {
  fullName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  familyName: "",
  phoneNumber: "",
  phoneAlternativeNumber: "",
  email: "",
  emailAlternative: "",
  phoneCode: "",
  DoB: "",
  address1: "",
  address2: "",
  apartment: "",
  building: "",
  floor: "",
  houseNumber: "",
  street: "",
  city: "",
  state: "",
  gender: "",
  country: "",
  linkedinUrl: "",
  twitterUrl: "",
  githubUrl: "",
  nationality: "",
  prefix: "",
  maritalStatus: "",
  servedInMilitary: "",
  workedPreviously: "",
  // userName: "",
  // password: "",
  degree: "",
  grossSalary: "",
  noticePeriod: "",
  phoneDeviceType: "",
  expectedSalary: "",
  zip: "",
  workAuthorization: "",
  visaSponsorship: "",
  disability: "",
  veteran: "",
  ethnicity: "",
  age: "",
  workExperiences: [
    {
      jobTitle: "",
      companyName: "",
      startDate: "",
      endDate: "",
      skills: "",
      stillWorking: false,
      description: "",
      location: "",
      workType: "",
    },
  ],
  projectExperiences: [
    {
      projectName: "",
      startDate: "",
      endDate: "",
      skills: "",
      stillWorking: false,
      description: "",
      gitUrl: "",
      hostUrl: "",
    },
  ],
  educationExperiences: [
    {
      courseName: "",
      field: "",
      collegeName: "",
      startDate: "",
      endDate: "",
      skills: "",
      stillStudying: false,
      description: "",
      grade: "",
      location: "",
      educationType: "Higher Education",
    },
  ],
};

const FormPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditable, setIsEditable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [cvName, setCvName] = useState("");

  // Utility function to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = useCallback((buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }, []);

  // Save file to Chrome storage
  const saveFileToLocalStorage = useCallback(
    (file, location) => {
      if (!file) {
        alert("No file selected");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result;
        const fileName = file.name;

        if (!fileContent) {
          alert("Error reading file");
          return;
        }

        const base64String = arrayBufferToBase64(fileContent);
        const fileUrl = `data:application/pdf;base64,${base64String}`;

        const storageData = {
          [`${location}Url`]: fileUrl,
          [`${location}Name`]: fileName,
          [`${location}Base64`]: base64String,
        };

        if (location === "resume") {
          setResumeUrl(fileUrl);
          setResumeName(fileName);
        } else if (location === "cv") {
          setCvUrl(fileUrl);
          setCvName(fileName);
        }

        saveFileData(storageData, (success, error) => {
          if (success) {
            console.log(`File ${location} saved to chrome storage.`);
          } else {
            console.error(`Error saving ${location} file:`, error);
            alert(`Error saving ${location} file. Please try again.`);
          }
        });
      };

      reader.onerror = () => {
        alert("Error reading file");
      };

      reader.readAsArrayBuffer(file);
    },
    [arrayBufferToBase64]
  );

  // Load data from Chrome storage on mount
  useEffect(() => {
    const loadDataFromStorage = () => {
      getUserData((userData) => {
        try {
          if (
            userData?.data?.details &&
            typeof userData.data.details === "object"
          ) {
            setFormData(userData.data.details);
          } else {
            console.warn(
              "No valid user data found in storage, using default form data"
            );
            setFormData(INITIAL_FORM_DATA);
          }
        } catch (error) {
          console.error("Error loading user data:", error);
          setFormData(INITIAL_FORM_DATA);
        }
        setLoading(false);
      });

      // Load file data separately
      getFileData((fileData) => {
        try {
          if (fileData?.resumeUrl && fileData?.resumeName) {
            setResumeUrl(fileData.resumeUrl);
            setResumeName(fileData.resumeName);
          }

          if (fileData?.cvUrl && fileData?.cvName) {
            setCvUrl(fileData.cvUrl);
            setCvName(fileData.cvName);
          }
        } catch (error) {
          console.error("Error loading file data:", error);
        }
      });
    };

    loadDataFromStorage();
  }, []);

  // Handle form input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Handle phone number changes
  const handlePhoneChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Parse phone numbers and extract country codes
  const parsePhoneNumbers = useCallback((data) => {
    const updates = {
      phoneCode: "",
      phoneNumber: "",
      phoneAlternativeCode: "",
      phoneAlternativeNumber: "",
    };

    if (data.phoneNumber) {
      try {
        const phoneNumberObj = parsePhoneNumber(data.phoneNumber);
        if (phoneNumberObj) {
          const countryCallingCode = getCountryCallingCode(
            phoneNumberObj.country
          );
          updates.phoneCode = `+${countryCallingCode}`;
          updates.phoneNumber = phoneNumberObj.nationalNumber.toString();
        }
      } catch (error) {
        console.error("Error parsing phone number:", error);
      }
    }

    if (data.phoneAlternativeNumber) {
      try {
        const phoneAltObj = parsePhoneNumber(data.phoneAlternativeNumber);
        if (phoneAltObj) {
          const countryCallingCode = getCountryCallingCode(
            phoneAltObj?.country
          );
          updates.phoneAlternativeCode = `+${countryCallingCode}`;
          updates.phoneAlternativeNumber =
            phoneAltObj.nationalNumber.toString();
        }
      } catch (error) {
        console.error("Error parsing alternative phone number:", error);
      }
    }

    return updates;
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      try {
        const phoneUpdates = parsePhoneNumbers(formData);

        getUserData((previousData) => {
          try {
            // Validate previous data structure
            const previousDetails = previousData?.data || {};

            const updatedData = {
              data: {
                ...previousDetails,
                details: {
                  ...formData,
                  ...phoneUpdates,
                },
                workExperiences:
                  previousDetails.workExperiences || formData.workExperiences,
                projectExperiences:
                  previousDetails.projectExperiences ||
                  formData.projectExperiences,
                educationExperiences:
                  previousDetails.educationExperiences ||
                  formData.educationExperiences,
              },
              error: "no error",
            };

            // Validate the updated data structure
            if (!updatedData.data || !updatedData.data.details) {
              console.error("Invalid data structure created");
              return;
            }

            saveUserData(updatedData, (success, error) => {
              if (success) {
                console.log(
                  "Form data saved successfully to local storage and backend"
                );
                setIsEditable(false);
              } else {
                console.error("Error saving form data:", error);
              }
            });
          } catch (error) {
            console.error("Error processing form data:", error);
          }
        });
      } catch (error) {
        console.error("Error saving form data:", error);
      }
    },
    [formData, parsePhoneNumbers]
  );

  // Handle edit mode toggle
  const handleEdit = useCallback((e) => {
    e.preventDefault();
    setIsEditable(true);
  }, []);

  // Handle file uploads
  const handleResumeChange = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.target.files[0];
      saveFileToLocalStorage(file, "resume");
    },
    [saveFileToLocalStorage]
  );

  const handleCvChange = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.target.files[0];
      saveFileToLocalStorage(file, "cv");
    },
    [saveFileToLocalStorage]
  );

  // Navigation functions
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  // Handle JSON import/export
  const handleDownloadJSON = useCallback(
    (e) => {
      e.preventDefault();
      downloadJSON(formData);
    },
    [formData]
  );

  const handleUploadJSON = useCallback((e) => {
    e.preventDefault();
    uploadJSON((jsonData) => {
      setFormData(jsonData);
      saveUserData(
        {
          data: { details: jsonData },
          error: "no error",
        },
        (success, error) => {
          if (success) {
            console.log(
              "JSON imported and saved to Chrome Storage and backend"
            );
          } else {
            console.error("Error saving JSON data:", error);
          }
        }
      );
    });
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="formpage-container">
      <div className="form-header">
        <h1 className="form-title">Candidate Profile</h1>
        <p className="form-subtitle">
          {isEditable
            ? "Complete your profile information"
            : "Review your profile"}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="progress-container">
        <div className="progress-track">
          <div
            className="progress-bar"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
        <div className="step-indicators">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`step-indicator ${
                currentStep >= step ? "active" : ""
              }`}
              onClick={() => goToStep(step)}
            >
              <div className="step-number">{step}</div>
              <div className="step-label">
                {step === 1 && "Personal"}
                {step === 2 && "Address"}
                {step === 3 && "Credentials"}
                {step === 4 && "Experience"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Transfer Buttons */}
      <div className="data-transfer-buttons">
        <button className="data-button" onClick={handleDownloadJSON}>
          <svg className="button-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Export JSON
        </button>
        <button className="data-button" onClick={handleUploadJSON}>
          <svg className="button-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm7.293-8.707a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 10.414V16a1 1 0 11-2 0v-5.586l-1.293 1.293a1 1 0 01-1.414-1.414l3-3z"
              clipRule="evenodd"
            />
          </svg>
          Import JSON
        </button>
      </div>

      {/* Form Content */}
      <div className="form-card">
        <form className="form-content">
          <FormSteps
            currentStep={currentStep}
            formData={formData}
            handleChange={handleChange}
            handlePhoneChange={handlePhoneChange}
            isEditable={isEditable}
            handleSubmit={handleSubmit}
            handleEdit={handleEdit}
            resumeName={resumeName}
            resumeUrl={resumeUrl}
            cvName={cvName}
            cvUrl={cvUrl}
            handleResumeChange={handleResumeChange}
            handleCvChange={handleCvChange}
          />
        </form>

        {/* Navigation Controls */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button className="nav-button prev-button" onClick={prevStep}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Previous
            </button>
          )}

          <div className="step-counter">Step {currentStep} of 4</div>

          {currentStep < 4 ? (
            <button className="nav-button next-button" onClick={nextStep}>
              Next
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : !isEditable ? (
            <button className="nav-button edit-button" onClick={handleEdit}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </button>
          ) : (
            <button className="nav-button submit-button" onClick={handleSubmit}>
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FormPage);
