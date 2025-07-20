import React, { useState, useEffect } from 'react';

const WorkExperiencePopup = ({ onClose, mode ,onSave}) => {
  // const [showSkillInput, setShowSkillInput] = useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [workData, setWorkData] = useState({
    jobTitle: '',
    startDate: '',
    endDate: '',
    stillWorking: false,
    description: '',
    companyName: '',
    location: '',
    workType: '',
  });
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(workData.stillWorking);


  const handleCurrentlyWorkingChange = (e) => {
    setIsCurrentlyWorking(e.target.checked);
    setWorkData({ ...workData, stillWorking: e.target.checked });
  };

  // const handleAddSkillClick = () => {
  //   setShowSkillInput(true);
  // };
  const handleChangeSkill = (e) => {
    e.preventDefault();
    setNewSkill(e.target.value);
  }

  const handleSkillInputChange = (e) => {
    e.preventDefault();
    // Add the skill to the skills array when user inputs a skill and presses Enter or clicks Add
    if (e.key === 'Enter' || e.type === 'click') {
      console.log("e",e)
      setSkills([...skills, newSkill]);
      setNewSkill("");
      // setShowSkillInput(false);
    }
  };

  const handleRemoveSkill = (index) => {
    // Remove the selected skill from the skills array
    const updatedSkills = skills.filter((_, i) => i !== index);
    setSkills(updatedSkills);
  };
const handleSave = (event) => {
    event.preventDefault();
    const updatedWorkData = {
        ...workData,
        skills: skills,
        id: Date.now(), 
    };

    chrome.storage.local.get(['formData'], (result) => {
        const existingData = result.formData?.data || {};
        const existingDetails = existingData.details || {};
        const existingWorkExperiences = existingDetails.workExperiences || [];

        const updatedDetails = {
            ...existingDetails,
            workExperiences: [...existingWorkExperiences, updatedWorkData],
        };

        const updatedData = {
            data: {
                ...existingData,
                details: updatedDetails,
            },
            error: "no error"
        };

        chrome.storage.local.set({ formData: updatedData }, () => {
            console.log("Updated data saved:", updatedData);
            onSave();
            onClose();
        });
    });
};


  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white w-full md:w-96 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between item-center">
          <h2 className="text-2xl font-semibold mb-4">Work Experience</h2>
          <button className="text-gray-600 mb-4 text-2xl" onClick={onClose}>
            X
          </button>
        </div>

        <input 
          type="text" 
          placeholder="Job Title" 
          className="w-full mb-4 p-2 border" 
          value={workData.jobTitle}
          disabled={!mode}
          onChange={(e) => setWorkData({ ...workData, jobTitle: e.target.value })}
        />

        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            className="mr-2"
            disabled={!mode}
            checked={isCurrentlyWorking}
            onChange={handleCurrentlyWorkingChange}
          />
          Currently Working
        </label>

        <input
          type="date"
          placeholder="Start Date"
          disabled={!mode}
          value={workData.startDate}
          className="w-full mb-4 p-2 border"
          onChange={(e) => setWorkData({ ...workData, startDate: e.target.value })}
        />

        <input
          type="date"
          placeholder="End Date"
          className={`w-full mb-4 p-2 border ${isCurrentlyWorking ? 'bg-gray-200' : ''}`}
          disabled={isCurrentlyWorking || !mode}
          value={workData.endDate}
          onChange={(e) => setWorkData({ ...workData, endDate: e.target.value })}
        />

        <input 
          type="text"
          placeholder="Company Name"
          className="w-full mb-4 p-2 border"
          disabled={!mode}
          value={workData.companyName}
          onChange={(e) => setWorkData({ ...workData, companyName: e.target.value })}
        />

<h3 className="text-gray-600 text-sm font-semibold mb-2">
  Skills
</h3>

        <div className="w-full mb-4 flex flex-wrap">
          {skills?.map((skill, index) => (
            <div
              key={index}
              className="bg-gray-300 text-sm rounded-full px-3 py-1 mr-2 mb-2 flex items-center"
            >
              {skill}
              <button
                onClick={() => handleRemoveSkill(index)}
                className="ml-2 text-xs font-semibold focus:outline-none"
              >
                x
              </button>
            </div>
          ))}
        </div>

       
          <div className="mb-4 flex flex-wrap">
            <input
              type="text"
              placeholder="Skill"
              className="p-2 border h-10 rounded-lg flex-grow"
              onChange={handleChangeSkill}
            />
            <button
              className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 ml-2"
              onClick={handleSkillInputChange}
            >
              Add
            </button>
          </div>
        

        <textarea 
          placeholder="Description" 
          className="w-full mb-4 p-2 border" 
          rows={3} 
          disabled={!mode}
          value={workData.description} 
          onChange={(e) => setWorkData({ ...workData, description: e.target.value })}
        />

        <input 
          type="text" 
          placeholder="Location" 
          className="w-full mb-4 p-2 border"
          disabled={!mode}
          value={workData.location}
          onChange={(e) => setWorkData({ ...workData, location: e.target.value })}
        />

        <select 
          className="mb-4 py-2 px-4 border" 
          value={workData.workType} 
          onChange={(e) => setWorkData({ ...workData, workType: e.target.value })}
        >
          <option value="">Work type</option>
          <option value="Onsite">Onsite</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Full remote">Full remote</option>
        </select>

        <div className="flex justify-between">
          <button
            onClick={handleSave}
            className="bg-black text-white px-6 py-2 rounded-lg mr-4 hover:bg-gray-800"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-black px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkExperiencePopup;