import React, { useState, useEffect } from 'react';
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import "./formpage.css";
import Educational from './Experience';
const FormPage = () => {
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

  const [currentStep, setCurrentStep] = useState(1);
  const [isEditable, setIsEditable] = useState(true);
  const [resume, setResume] = useState(localStorage.getItem('resume') || '');
  const [cv, setCv] = useState(localStorage.getItem('cv') || '');
  function saveFileToLocalStorage(file,location) {
    const fileInput = document.getElementById('fileInput');

    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
          const fileContent = event.target?.result as string | ArrayBuffer | null;
          if (typeof fileContent === 'string') {
              localStorage.setItem(location, fileContent);
              alert('File saved to local storage!');
          } else if (fileContent instanceof ArrayBuffer) {
              // Convert ArrayBuffer to string if needed
              const convertedFileContent = String.fromCharCode.apply(null, new Uint16Array(fileContent));
              localStorage.setItem(location, convertedFileContent);
              alert('File saved to local storage!');
          } else {
              alert('Error reading file');
          }
      };

        reader.readAsDataURL(file); // Read file as Base64 string
    } else {
        alert('No file selected');
    }
}

  useEffect(() => {
    // Save to local storage whenever resume or cv changes
    localStorage.setItem('resume', resume);
    localStorage.setItem('cv', cv);
  }, [resume, cv]);

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    saveFileToLocalStorage(file,'resume');
    setResume(file ? file.name : '');
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    saveFileToLocalStorage(file,'cv');
    setCv(file ? file.name : '');
  };

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
    const output = {
      data: {
        details: {
          ...formData,
        },
        workExperiences: [],
        projectExperiences: [],
        educationExperiences: []
      },
      error: "no error"
    };
    console.log(output);
    chrome.storage.local.set({ 'formData': output }, () => {
      console.log('Form data saved');
      setIsEditable(false);
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
                  <button type="submit" className="btn-primary mr-2">Save</button>
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
                  <button type="submit" className="btn-primary mr-2">Save</button>
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
                  <button type="submit" className="btn-primary mr-2">Save</button>
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
            <Educational
              mode={isEditable}
              userData={formData}
              setUserData={setFormData} 
            />
            <input
        type="file"
        onChange={handleResumeChange}
       
      />
      <br />
      <input
        type="file"
        onChange={handleCvChange}
    
      />
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
        {/* Add more subheadings for additional steps */}
      </div>
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
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

export default FormPage;
