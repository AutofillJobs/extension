import React, { useState, useEffect, useMemo, useCallback } from 'react';
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import "./formpage.css";
import Experience from './Experience';
import {
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";
import PdfBar from "./PdfBar";
import { downloadJSON, uploadJSON } from "./JsonImportExport";
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
        if (userData?.data?.details) {
          setFormData(userData.data.details);
        }
        setLoading(false);
      });

      // Load file data separately
      getFileData((fileData) => {
        if (fileData?.resumeUrl && fileData?.resumeName) {
          setResumeUrl(fileData.resumeUrl);
          setResumeName(fileData.resumeName);
        }

        if (fileData?.cvUrl && fileData?.cvName) {
          setCvUrl(fileData.cvUrl);
          setCvName(fileData.cvName);
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
          const countryCallingCode = getCountryCallingCode(phoneAltObj.country);
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

        saveUserData(updatedData, (success, error) => {
          if (success) {
            console.log('Form data saved successfully to local storage and backend');
            setIsEditable(false);
            // Show success message to user
          } else {
            console.error('Error saving form data:', error);
          }
        });
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

  // Form field configurations
  const personalFields = useMemo(() => [
    { label: 'Full Name', name: 'fullName', type: 'text' },
    { label: 'First Name', name: 'firstName', type: 'text' },
    { label: 'Middle Name', name: 'middleName', type: 'text' },
    { label: 'Last Name', name: 'lastName', type: 'text' },
    { label: 'Family Name', name: 'familyName', type: 'text' },
    { label: 'Preferred Name', name: 'preferredName', type: 'text' },
    { label: 'Marital Status', name: 'maritalStatus', type: 'select', options: ['Single', 'Married', 'Divorced'] },
    { label: 'Gender', name: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { label: 'Prefix', name: 'prefix', type: 'text' },
    { label: 'Date of Birth', name: 'DoB', type: 'date', placeholder: 'dd-mm-yyyy' },
  ], []);

  const addressFields = useMemo(() => [
    { label: 'Address Line 1', name: 'address1', type: 'text' },
    { label: 'Address Line 2', name: 'address2', type: 'text' },
    { label: 'Apartment', name: 'apartment', type: 'text' },
    { label: 'Building', name: 'building', type: 'text' },
    { label: 'Floor', name: 'floor', type: 'text' },
    { label: 'Street', name: 'street', type: 'text' },
    { label: 'House Number', name: 'houseNumber', type: 'text' },
    { label: 'City', name: 'city', type: 'text' },
    { label: 'State', name: 'state', type: 'text' },
    { label: 'Country', name: 'country', type: 'text' },
    { label: 'Zip/Postal Code', name: 'zip', type: 'text' },
  ], []);

  const credentialFields = useMemo(() => [
    { label: 'Username', name: 'userName', type: 'text' },
    { label: 'Password', name: 'password', type: 'password' },
    { label: 'LinkedIn URL', name: 'linkedinUrl', type: 'url' },
    { label: 'GitHub URL', name: 'githubUrl', type: 'url' },
    { label: 'Twitter URL', name: 'twitterUrl', type: 'url' },
    { label: 'Email ID', name: 'email', type: 'email' },
    { label: 'Alternative Email ID', name: 'emailAlternative', type: 'email' },
    { label: 'Expected Salary', name: 'expectedSalary', type: 'text' },
    { label: 'Gross Salary', name: 'grossSalary', type: 'text' },
    { label: 'Notice Period', name: 'noticePeriod', type: 'text' },
    { label: 'Worked Previously', name: 'workedPreviously', type: 'text' },
    { 
      label: 'Are you authorized to work in the country you are located in?', 
      name: 'workAuthorization', 
      type: 'select', 
      options: ['Yes', 'No', 'I choose not to disclose'] 
    },
    { 
      label: 'Will you now or in the future require visa sponsorship for employment?', 
      name: 'visaSponsorship', 
      type: 'select', 
      options: ['Yes', 'No', 'I choose not to disclose'] 
    },
    { 
      label: 'Do you have a disability?', 
      name: 'disability', 
      type: 'select', 
      options: ['Yes', 'No', 'I choose not to disclose'] 
    },
    { 
      label: 'Are you a veteran?', 
      name: 'veteran', 
      type: 'select', 
      options: ['Yes', 'No', 'I choose not to disclose'] 
    },
    { 
      label: 'Ethnicity', 
      name: 'ethnicity', 
      type: 'select', 
      options: [
        'American Indian or Alaska Native',
        'Asian',
        'Black or African American',
        'Hispanic or Latino',
        'Native Hawaiian or Other Pacific Islander',
        'White',
        'I choose not to disclose'
      ] 
    },
    { 
      label: 'Age', 
      name: 'age', 
      type: 'select', 
      options: ['I choose not to disclose', ...Array.from({ length: 78 }, (_, i) => (13 + i).toString())] 
    },
  ], []);

  // Render form fields
  const renderFormFields = useCallback((fields) => {
    return fields.map((field, index) => (
      <div key={index}>
        <label htmlFor={field.name} className="block font-medium">
          {field.label}
        </label>
        {field.type === 'select' ? (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
            className="input"
            disabled={!isEditable}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
            className="input"
            placeholder={field.placeholder}
            disabled={!isEditable}
          />
        )}
      </div>
    ));
  }, [formData, handleChange, isEditable]);

  // Render step content
  const renderStep = useCallback(() => {
    const stepHeader = (title) => (
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div>
          {isEditable ? (
            <button type="submit" onClick={handleSubmit} className="btn-primary mr-2">
              Save
            </button>
          ) : (
            <button type="button" onClick={handleEdit} className="btn-primary mr-2">
              Edit
            </button>
          )}
        </div>
      </div>
    );

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {stepHeader('Personal Information')}
            <div className="grid grid-cols-2 gap-4">
              {renderFormFields(personalFields)}
              <div>
                <label htmlFor="phoneNumber" className="block font-medium">
                  Contact Number
                </label>
                <PhoneInput
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={(value) => handlePhoneChange('phoneNumber', value)}
                  className="input"
                  placeholder="International phone number"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor="phoneAlternativeNumber" className="block font-medium">
                  Alternative Contact Number
                </label>
                <PhoneInput
                  id="phoneAlternativeNumber"
                  name="phoneAlternativeNumber"
                  value={formData.phoneAlternativeNumber || ''}
                  onChange={(value) => handlePhoneChange('phoneAlternativeNumber', value)}
                  className="input"
                  disabled={!isEditable}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {stepHeader('Address Information')}
            <div className="grid grid-cols-2 gap-4">
              {renderFormFields(addressFields)}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {stepHeader('Credentials')}
            <div className="grid grid-cols-2 gap-4">
              {renderFormFields(credentialFields)}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="education-section">
              <Experience />
            </div>
            <div className="file-upload-section">
              <h3 className="file-upload-heading">Upload Documents</h3>
              <div className="file-input-container">
                <div className="file-input-wrapper">
                  {resumeName && (
                    <PdfBar 
                      fileName="Resume" 
                      fileUrl={resumeUrl} 
                      type="resume" 
                    />
                  )}
                  <label htmlFor="resumeInput" className="file-input-label">
                    Resume
                  </label>
                  <div className="custom-file-input">
                    <input
                      id="resumeInput"
                      type="file"
                      onChange={handleResumeChange}
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                </div>

                <div className="file-input-wrapper">
                  {cvName && (
                    <PdfBar 
                      fileName="Cover Letter" 
                      fileUrl={cvUrl} 
                      type="cv" 
                    />
                  )}
                  <label htmlFor="cvInput" className="file-input-label">
                    Cover Letter
                  </label>
                  <div className="custom-file-input">
                    <input
                      id="cvInput"
                      type="file"
                      onChange={handleCvChange}
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [
    currentStep, 
    isEditable, 
    handleSubmit, 
    handleEdit, 
    renderFormFields,
    personalFields,
    addressFields,
    credentialFields,
    formData,
    handlePhoneChange,
    resumeName,
    resumeUrl,
    cvName,
    cvUrl,
    handleResumeChange,
    handleCvChange
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className='subheading-container'>
        <h3 className="subheading" onClick={() => goToStep(1)}>
          Personal Information
        </h3>
        <h3 className="subheading" onClick={() => goToStep(2)}>
          Address Information
        </h3>
        <h3 className="subheading" onClick={() => goToStep(3)}>
          Credentials
        </h3>
        <h3 className="subheading" onClick={() => goToStep(4)}>
          Experience
        </h3>
      </div>

      <div className="flex gap-4 mb-4">
        <button className="btn-primary" onClick={handleDownloadJSON}>
          Download JSON
        </button>
        <button className="btn-primary" onClick={handleUploadJSON}>
          Upload JSON
        </button>
      </div>

      <div className="container mx-auto p-4">
        <form className="space-y-6">
          {renderStep()}
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
    </>
  );
};

export default React.memo(FormPage);
