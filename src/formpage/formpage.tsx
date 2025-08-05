import React, { useState, useEffect, useCallback } from 'react';
import "./formpage.css";
import FormSteps from './components/FormSteps';
import {
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";
import { downloadJSON, uploadJSON } from "./components/JsonImportExport";
import { saveUserData, saveFileData, getUserData, getFileData } from '../utils/storageHandler';

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
  userName: "",
  password: "",
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
  workExperiences: [{
    jobTitle: "",
    companyName: "",
    startDate: "",
    endDate: "",
    skills: "",
    stillWorking: false,
    description: "",
    location: "",
    workType: ""
  }],
  projectExperiences: [{
    projectName: "",
    startDate: "",
    endDate: "",
    skills: "",
    stillWorking: false,
    description: "",
    gitUrl: "",
    hostUrl: ""
  }],
  educationExperiences: [{
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
    educationType: "Higher Education"
  }]
};

const FormPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditable, setIsEditable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [cvName, setCvName] = useState('');

  // Utility function to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = useCallback((buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }, []);

  // Save file to Chrome storage
  const saveFileToLocalStorage = useCallback((file, location) => {
    if (!file) {
      alert('No file selected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result;
      const fileName = file.name;
      
      if (!fileContent) {
        alert('Error reading file');
        return;
      }

      const base64String = arrayBufferToBase64(fileContent);
      const fileUrl = `data:application/pdf;base64,${base64String}`;

      const storageData = {
        [`${location}Url`]: fileUrl,
        [`${location}Name`]: fileName,
        [`${location}Base64`]: base64String
      };

      if (location === 'resume') {
        setResumeUrl(fileUrl);
        setResumeName(fileName);
      } else if (location === 'cv') {
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
      alert('Error reading file');
    };

    reader.readAsArrayBuffer(file);
  }, [arrayBufferToBase64]);

  // Load data from Chrome storage on mount
  useEffect(() => {
    const loadDataFromStorage = () => {
      getUserData((userData) => {
        try {
          if (userData?.data?.details && typeof userData.data.details === 'object') {
            setFormData(userData.data.details);
          } else {
            console.warn('No valid user data found in storage, using default form data');
            setFormData(INITIAL_FORM_DATA);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
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
          console.error('Error loading file data:', error);
        }
      });
    };

    loadDataFromStorage();
  }, []);

  // Handle form input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle phone number changes
  const handlePhoneChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
          const countryCallingCode = getCountryCallingCode(phoneNumberObj.country);
          updates.phoneCode = `+${countryCallingCode}`;
          updates.phoneNumber = phoneNumberObj.nationalNumber.toString();
        }
      } catch (error) {
        console.error('Error parsing phone number:', error);
      }
    }

    if (data.phoneAlternativeNumber) {
      try {
        const phoneAltObj = parsePhoneNumber(data.phoneAlternativeNumber);
        if (phoneAltObj) {
          const countryCallingCode = getCountryCallingCode(phoneAltObj?.country);
          updates.phoneAlternativeCode = `+${countryCallingCode}`;
          updates.phoneAlternativeNumber = phoneAltObj.nationalNumber.toString();
        }
      } catch (error) {
        console.error('Error parsing alternative phone number:', error);
      }
    }

    return updates;
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
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
                ...phoneUpdates
              },
              workExperiences: previousDetails.workExperiences || formData.workExperiences,
              projectExperiences: previousDetails.projectExperiences || formData.projectExperiences,
              educationExperiences: previousDetails.educationExperiences || formData.educationExperiences
            },
            error: "no error"
          };

          // Validate the updated data structure
          if (!updatedData.data || !updatedData.data.details) {
            console.error('Invalid data structure created');
            return;
          }

          saveUserData(updatedData, (success, error) => {
            if (success) {
              console.log('Form data saved successfully to local storage and backend');
              setIsEditable(false);
            } else {
              console.error('Error saving form data:', error);
            }
          });
        } catch (error) {
          console.error('Error processing form data:', error);
        }
      });
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [formData, parsePhoneNumbers]);

  // Handle edit mode toggle
  const handleEdit = useCallback((e) => {
    e.preventDefault();
    setIsEditable(true);
  }, []);

  // Handle file uploads
  const handleResumeChange = useCallback((e) => {
    e.preventDefault();
    const file = e.target.files[0];
    saveFileToLocalStorage(file, 'resume');
  }, [saveFileToLocalStorage]);

  const handleCvChange = useCallback((e) => {
    e.preventDefault();
    const file = e.target.files[0];
    saveFileToLocalStorage(file, 'cv');
  }, [saveFileToLocalStorage]);

  // Navigation functions
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  // Handle JSON import/export
  const handleDownloadJSON = useCallback((e) => {
    e.preventDefault();
    downloadJSON(formData);
  }, [formData]);

  const handleUploadJSON = useCallback((e) => {
    e.preventDefault();
    uploadJSON((jsonData) => {
      setFormData(jsonData);
      saveUserData({ 
        data: { details: jsonData }, 
        error: "no error" 
      }, (success, error) => {
        if (success) {
          console.log('JSON imported and saved to Chrome Storage and backend');
        } else {
          console.error('Error saving JSON data:', error);
        }
      });
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
      <div className='subheading-container'>
        <h3 className={`subheading ${currentStep === 1 ? 'active' : ''}`} onClick={() => goToStep(1)}>
          Personal Information
        </h3>
        <h3 className={`subheading ${currentStep === 2 ? 'active' : ''}`} onClick={() => goToStep(2)}>
          Address Information
        </h3>
        <h3 className={`subheading ${currentStep === 3 ? 'active' : ''}`} onClick={() => goToStep(3)}>
          Credentials
        </h3>
        <h3 className={`subheading ${currentStep === 4 ? 'active' : ''}`} onClick={() => goToStep(4)}>
          Experience
        </h3>
      </div>

      <div className="json-buttons">
        <button className="btn-primary" onClick={handleDownloadJSON}>
          Download JSON
        </button>
        <button className="btn-primary" onClick={handleUploadJSON}>
          Upload JSON
        </button>
      </div>

      <div className="container">
        <form className="space-y-6">
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
        
        {currentStep > 1 && (
          <button className="arrow-button arrow-left" onClick={prevStep}>
            &#9664;
          </button>
        )}
        {currentStep < 4 && (
          <button className="arrow-button arrow-right" onClick={nextStep}>
            &#9654;
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(FormPage); 


