import React, { useMemo, useCallback, Suspense } from 'react';
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import LazyExperience from './LazyExperience';

const FormSteps = ({ 
  currentStep, 
  formData, 
  handleChange, 
  handlePhoneChange, 
  isEditable, 
  handleSubmit, 
  handleEdit,
  resumeName,
  resumeUrl,
  cvName,
  cvUrl,
  handleResumeChange,
  handleCvChange
}) => {
  // Form field configurations
  const personalFields = useMemo(() => [
    { label: 'Username', name: 'userName', type: 'text' },
    { label: 'Password', name: 'password', type: 'password' },
    { label: 'Full Name', name: 'fullName', type: 'text' },
    { label: 'First Name', name: 'firstName', type: 'text' },
    { label: 'Middle Name', name: 'middleName', type: 'text' },
    { label: 'Last Name', name: 'lastName', type: 'text' },
    { label: 'Email ID', name: 'email', type: 'email' },
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
    { label: 'LinkedIn URL', name: 'linkedinUrl', type: 'url' },
    { label: 'GitHub URL', name: 'githubUrl', type: 'url' },
    { label: 'Twitter URL', name: 'twitterUrl', type: 'url' },
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
      <div key={index} className="space-y-1">
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
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled={!isEditable}
          />
        )}
      </div>
    ));
  }, [formData, handleChange, isEditable]);

  // Render step content
  const renderStep = useCallback(() => {
    const stepHeader = (title) => (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <div>
          {isEditable ? (
            <button type="submit" onClick={handleSubmit} className="btn-primary">
              Save
            </button>
          ) : (
            <button type="button" onClick={handleEdit} className="btn-primary">
              Edit
            </button>
          )}
        </div>
      </div>
    );

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {stepHeader('Personal Information')}
            <div className="grid grid-cols-2 gap-6">
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
          <div className="space-y-6">
            {stepHeader('Address Information')}
            <div className="grid grid-cols-2 gap-6">
              {renderFormFields(addressFields)}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {stepHeader('Credentials')}
            <div className="grid grid-cols-2 gap-6">
              {renderFormFields(credentialFields)}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="education-section">
              <LazyExperience />
            </div>
            <div className="file-upload-section">
              <h3 className="file-upload-heading">Upload Documents</h3>
              <div className="file-input-container">
                <div className="file-input-wrapper">
                  {resumeName && (
                    <div className="text-sm text-green-600 mb-2">✓ Resume uploaded: {resumeName}</div>
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
                      disabled={!isEditable}
                    />
                  </div>
                </div>

                <div className="file-input-wrapper">
                  {cvName && (
                    <div className="text-sm text-green-600 mb-2">✓ Cover Letter uploaded: {cvName}</div>
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
                      disabled={!isEditable}
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

  return renderStep();
};

export default React.memo(FormSteps); 