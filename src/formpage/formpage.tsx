import React, { useState, useEffect,useMemo } from 'react';
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import "./formpage.css";
import Educational from './Experience';
import {
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";
const FormPage = () => {
  console.log('FormPage rendering');
  const [resumeUrl, setResumeUrl] = useState('');
const [cvUrl, setCvUrl] = useState('');

  const [formData, setFormData] = useState({
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
  });

  const clearStorage = () => {
    chrome.storage.local.clear(() => {
      console.log('Chrome storage cleared.');
    });
  };

 
  

 

  const [currentStep, setCurrentStep] = useState(1);
  const [isEditable, setIsEditable] = useState(true);
  const [resumeName, setResumeName] = useState('');
  const [cvName, setCvName] = useState('');
  function saveFileToLocalStorage(file, location) {
    if (file) {
      const reader = new FileReader();
  
      reader.onload = function(event) {
        const fileContent = event.target?.result;
        const fileName = file.name;
        if (fileContent) {
          const base64String = arrayBufferToBase64(fileContent);
          const blob = new Blob([fileContent], { type: file.type });
          const fileUrl = `data:application/pdf;base64,${base64String}`
  
          if (location === 'resume') {
            setResumeUrl(fileUrl);
            setResumeName(fileName);
            chrome.storage.local.set({ resumeUrl: fileUrl, resumeName: fileName,resumeBase64: base64String});
          } else if (location === 'cv') {
            setCvUrl(fileUrl);
            setCvName(fileName);
            chrome.storage.local.set({ cvUrl: fileUrl, cvName: fileName,cvBase64: base64String});
          }
  
          chrome.storage.local.set({ [location]: fileContent }, () => {
            console.log(`File ${location} saved to chrome storage.`);
          });
        } else {
          alert('Error reading file');
        }
      };
  
      reader.readAsArrayBuffer(file); // Read file as ArrayBuffer
    } else {
      alert('No file selected');
    }
  }
  
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  
  
  

  useEffect(() => {
    chrome.storage.local.get(['resumeUrl', 'resumeName', 'cvUrl', 'cvName'], (result) => {
      if (result.resumeUrl) {
        setResumeUrl(result.resumeUrl);
      }
      if (result.resumeName) {
        setResumeName(result.resumeName);
      }
      if (result.cvUrl) {
        setCvUrl(result.cvUrl);
      }
      if (result.cvName) {
        setCvName(result.cvName);
      }
    });
  }, []);

  const handleResumeChange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    saveFileToLocalStorage(file,'resume');
   
  };

  const handleCvChange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    saveFileToLocalStorage(file,'cv');
  };

  const memoizedFormData = useMemo(() => formData, [formData]);

  useEffect(() => {
    chrome.storage.local.get(['formData'], (result) => {
      if (result.formData) {
        setFormData(result.formData.data.details);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    chrome.storage.local.get('formData', (result) => {
      const previousData = result.formData || { data: {} };
      console.log("previous",previousData);
      const previousDetails = previousData.data || {};

      let updates = {phoneCode:"",phoneNumber:"",phoneAlternativeNumber:""};


      if (formData.phoneNumber) {
        const phoneNumberObj = parsePhoneNumber(formData.phoneNumber);
        if (phoneNumberObj) {
          const countryCallingCode = getCountryCallingCode(phoneNumberObj.country);
          updates.phoneCode = `+${countryCallingCode}`;
          updates.phoneNumber = phoneNumberObj.nationalNumber.toString();
        }
      }
  
      // Similar logic for alternative phone number
      if (formData.phoneAlternativeNumber) {
        const phoneAltObj = parsePhoneNumber(formData.phoneAlternativeNumber);
        if (phoneAltObj) {
          // Assuming you want to keep the same country code logic for alternative numbers
          updates.phoneAlternativeNumber = phoneAltObj.nationalNumber.toString();
          // If you need a separate field for the alternative phone's country code, add it here
        }
      }

      console.log("updates",updates);
  
      const updatedData = {
        data: {
          ...previousDetails,
          details: {
            ...formData,
            ...updates
          },
          workExperiences: previousDetails.workExperiences || [],
          projectExperiences: previousDetails.projectExperiences || [],
          educationExperiences: previousDetails.educationExperiences || []
        },
        error: "no error"
      };
  
      chrome.storage.local.set({ 'formData': updatedData }, () => {
        console.log('Form data saved');
        console.log(updatedData);
        setIsEditable(false);
      });
    });
  };
  
  

  const handleEdit = (e) => {
    e.preventDefault()
    setIsEditable(true);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-4">Personal Information</h2>
              <div>
                {isEditable ? (
                  <button type="submit" onClick={handleSubmit} className="btn-primary mr-2">Save</button>
                ) : (
                  <button type="button" onClick={handleEdit} className="btn-primary mr-2">Edit</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Personal Information Fields */}
              {[
                { label: 'Full Name', name: 'fullName', type: 'text' },
                { label: 'First Name', name: 'firstName', type: 'text' },
                { label: 'Middle Name', name: 'middleName', type: 'text' },
                { label: 'Last Name', name: 'lastName', type: 'text' },
                { label: 'Family Name', name: 'familyName', type: 'text' },
                { label: 'Preferred Name', name: 'preferredName', type: 'text' },
                { label: 'Marital Status', name: 'maritalStatus', type: 'select', options: ['Single', 'Married', 'Divorced'] },
                { label: 'Gender', name: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                { label: 'Prefix', name: 'prefix', type: 'text' },
                { label: 'Date of Birth', name: 'DoB', type: 'text', placeholder: 'dd-mm-yyyy' },
              ].map((field, index) => (
                <div key={index}>
                  <label htmlFor={field.name} className="block font-medium">{field.label}</label>
                  {field.type === 'select' ? (
                    <select id={field.name} name={field.name} value={formData[field.name]} onChange={handleChange} className="input" disabled={!isEditable}>
                      <option value="">Select {field.label}</option>
                      {field.options.map((option, i) => (
                        <option key={i} value={option.toLowerCase()}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input type={field.type} id={field.name} name={field.name} value={formData[field.name]} onChange={handleChange} className="input" placeholder={field.placeholder} disabled={!isEditable} />
                  )}
                </div>
              ))}
              <div>
                <label htmlFor="phoneNumber" className="block font-medium">Contact Number</label>
                <PhoneInput
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                  className="input"
                  placeholder="International phone number"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor="phoneAlternativeNumber" className="block font-medium">Alternative Contact Number</label>
                <PhoneInput
                  id="phoneAlternativeNumber"
                  name="phoneAlternativeNumber"
                  value={formData.phoneAlternativeNumber}
                  onChange={(value) => setFormData({ ...formData, phoneAlternativeNumber: value })}
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-4">Address Information</h2>
              <div>
                {isEditable ? (
                  <button type="submit" onClick={handleSubmit} className="btn-primary mr-2">Save</button>
                ) : (
                  <button type="button" onClick={handleEdit} className="btn-primary mr-2">Edit</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Address Information Fields */}
              {[
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
              ].map((field, index) => (
                <div key={index}>
                  <label htmlFor={field.name} className="block font-medium">{field.label}</label>
                  <input type={field.type} id={field.name} name={field.name} value={formData[field.name]} onChange={handleChange} className="input" disabled={!isEditable} />
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-4">Credentials</h2>
              <div>
                {isEditable ? (
                  <button type="submit" onClick={handleSubmit} className="btn-primary mr-2">Save</button>
                ) : (
                  <button type="button" onClick={handleEdit} className="btn-primary mr-2">Edit</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Credentials Fields */}
              {[
                { label: 'Username', name: 'userName', type: 'text' },
                { label: 'Password', name: 'password', type: 'password' },
                { label: 'LinkedIn URL', name: 'linkedinUrl', type: 'text' },
                { label: 'GitHub URL', name: 'githubUrl', type: 'text' },
                { label: 'Twitter URL', name: 'twitterUrl', type: 'text' },
                { label: 'Email ID', name: 'email', type: 'text' },
                { label: 'Alternative Email ID', name: 'emailAlternative', type: 'text' },
                { label: 'Expected Salary', name: 'expectedSalary', type: 'text' },
                { label: 'Gross Salary', name: 'grossSalary', type: 'text' },
                { label: 'Notice Period', name: 'noticePeriod', type: 'text' },
                { label: 'Worked Previously', name: 'workedPreviously', type: 'text' },
              ].map((field, index) => (
                <div key={index}>
                  <label htmlFor={field.name} className="block font-medium">{field.label}</label>
                  <input type={field.type} id={field.name} name={field.name} value={formData[field.name]} onChange={handleChange} className="input" disabled={!isEditable} />
                </div>
              ))}
            </div>
          </div>
        );
        case 4:
          return (
            <div>
              <div className="education-section">
                <Educational />
              </div>
              <div className="file-upload-section">
              <h3 className="file-upload-heading">Upload Documents</h3>
              <div className="file-input-container">
                <div className="file-input-wrapper">
                  <label htmlFor="resumeInput" className="file-input-label">Resume</label>
                  <div className="custom-file-input">
                    <input
                      id="resumeInput"
                      type="file"
                      onChange={handleResumeChange}
                      accept=".pdf,.doc,.docx"
                    />
                    <span className="file-name">{resumeName || 'No file chosen'}</span>
                  </div>
                  {resumeUrl && (
                    <a href={resumeUrl} download="resume" className="download-link">Download Resume</a>
                  )}
                </div>
                <div className="file-input-wrapper">
                  <label htmlFor="cvInput" className="file-input-label">Cover Letter</label>
                  <div className="custom-file-input">
                    <input
                      id="cvInput"
                      type="file"
                      onChange={handleCvChange}
                      accept=".pdf,.doc,.docx"
                    />
                    <span className="file-name">{cvName || 'No file chosen'}</span>
                  </div>
                  {cvUrl && (
                    <a href={cvUrl} download="cover_letter" className="download-link">Download Cover Letter</a>
                  )}
                </div>
              </div>
            </div>
            </div>
          );

        
      default:
        return null;
    }
  };

  return (
    <>
    <div className='subheading-container'>
        <h3 className="subheading" onClick={() => goToStep(1)}>Personal Information</h3>
        <h3 className="subheading" onClick={() => goToStep(2)}>Address Information</h3>
        <h3 className="subheading" onClick={() => goToStep(3)}>Credentials</h3>
        <h3 className="subheading" onClick={() => goToStep(4)}>Experience</h3>
        {/* Add more subheadings for additional steps */}
      </div>
    <div className="container mx-auto p-4">
      <form  className="space-y-6">
        {renderStep()}
      </form>
      {currentStep > 1 && (
        <button className="arrow-button arrow-left" onClick={prevStep}>&#9664;</button>
      )}
      {currentStep < 4&& (
        <button className="arrow-button arrow-right" onClick={nextStep}>&#9654;</button>
      )}
    </div>
    </>
  );
};

export default React.memo(FormPage);
