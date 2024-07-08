import React, { useState, useEffect } from 'react';
const EducationExperienceDisplay = ({ onClose, mode, id }) => {
  const [educationData, setEducationData] = useState({
    courseName: "",
    field: "",
    startDate: "",
    collegeName: "",
    endDate: "",
    stillStudying: false,
    description: "",
    grade: "",
    location: "",
    educationType: "",
    skills: []
  });

  useEffect(() => {
    chrome.storage.local.get('formData', (result) => {
      if (result.formData && result.formData.educationExperiences) {
        const experience = result.formData.educationExperiences.find(exp => exp.id === id);
        if (experience) {
          setEducationData(experience);
        }
      }
    });
  }, [id]);

  const handleDiscard = () => {
    chrome.storage.local.get('formData', (result) => {
      if (result.formData && result.formData.educationExperiences) {
        const updatedExperiences = result.formData.educationExperiences.filter(exp => exp.id !== id);
        const updatedFormData = {
          ...result.formData,
          educationExperiences: updatedExperiences
        };
        chrome.storage.local.set({ 'formData': updatedFormData }, () => {
          console.log('Education Experience deleted successfully');
          onClose();
        });
      }
    });
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white w-full md:w-96 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between item-center">
          <h2 className="text-gray-800 text-xl font-semibold mb-4">Education Experience</h2>
          <button className="text-gray-600 mb-4 text-xl" onClick={onClose}>
            X
          </button>
        </div>

        <p className="text-gray-600 text-lg mb-2">Course Name</p>
        <p className="w-full p-2 border text-black">{educationData.courseName}</p>

        <p className="text-gray-600 text-lg mt-2">Field</p>
        <p className="w-full p-2 border text-black">{educationData.field}</p>

        <div className="flex my-4">
          <p className="text-gray-600 text-lg mt-2">Start Date</p>
          <p className="p-2 ml-2 border text-black">{educationData.startDate}</p>
        </div>
        
        {educationData.stillStudying ? (
          <label className="flex items-center mb-4">
            <span className="text-gray-600 text-lg">Currently Studying</span>
          </label>
        ) : (
          <div className="flex my-4">
            <p className="text-gray-600 text-lg mt-2">End Date</p>
            <p className="p-2 ml-2 border text-black">{educationData.endDate}</p>
          </div>
        )}

        <div className="w-full m-2 flex flex-wrap">
          {educationData.skills?.map((skill, index) => (
            <div
              key={index}
              className="bg-gray-300 text-sm rounded-full px-3 py-1 mr-2 mb-2 flex items-center"
            >
              {skill}
            </div>
          ))}
        </div>

        <div className="flex my-4">
          <p className="text-gray-600 text-lg mt-2">Grade</p>
          <p className="w-full mb-2 p-2 border text-black">{educationData.grade}</p>
        </div>

        {educationData.educationType !== "Online Education" && (
          <div className="flex my-4">
            <p className="text-gray-600 text-lg mt-2">Location</p>
            <p className="w-full ml-2 p-2 border text-black">{educationData.location}</p>
          </div>
        )}

        <div className="flex my-4">
          <p className="text-gray-600 text-lg mt-2">Type</p>
          <p className="w-full ml-2 p-2 border text-black">{educationData.educationType}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleDiscard}
            className="bg-gray-400 text-black px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationExperienceDisplay;