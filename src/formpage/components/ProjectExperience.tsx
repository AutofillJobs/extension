import React, { useState, useEffect } from 'react';
import { getUserData, saveUserData } from '../../utils/storageHandler';

const ProjectExperiencePopup = ({ onClose, mode, onSave }) => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [projectData, setProjectData] = useState({
    projectName: "",
    startDate: "",
    endDate: "",
    stillWorking: false,
    description: "",
    gitUrl: "",
    hostUrl: "",
  });
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(projectData.stillWorking);

  useEffect(() => {
    getUserData((userData) => {
      if (userData && userData.data?.details?.projectExperiences) {
        // If you want to edit an existing experience, you would need to pass an ID prop
        // and then find the specific experience here
      }
    });
  }, []);

  const handleCurrentlyWorkingChange = (e) => {
    setIsCurrentlyWorking(e.target.checked);
    setProjectData({ ...projectData, stillWorking: e.target.checked });
  };

  const handleChangeSkill = (e) => {
    setNewSkill(e.target.value);
  };

  const handleSkillInputChange = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newSkill.trim()) {
      e.preventDefault();
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (index) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    setSkills(updatedSkills);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const updatedProjectData = {
      ...projectData,
      skills: skills,
      id: Date.now(), 
    };

    getUserData((userData) => {
      const existingFormData = userData || {};
      const existingDetails = existingFormData.data?.details || {};
      const existingProjectExperiences = existingDetails.projectExperiences || [];
      
      const updatedFormData = {
        ...existingFormData,
        data: {
          ...existingFormData.data,
          details: {
            ...existingDetails,
            projectExperiences: [...existingProjectExperiences, updatedProjectData],
          }
        }
      };

      saveUserData(updatedFormData, (success, error) => {
        if (success) {
          console.log('Project experience data saved');
          onSave();
          onClose();
        } else {
          console.error('Error saving project experience:', error);
        }
      });
    });
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white w-full md:w-96 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between item-center">
          <h2 className="text-2xl font-semibold mb-4">Project Experience</h2>
          <button className="text-gray-600 mb-4 text-2xl" onClick={onClose}>
            X
          </button>
        </div>

        <input
          type="text"
          placeholder="Project Name"
          className="w-full mb-4 p-2 border"
          value={projectData.projectName}
          disabled={!mode}
          onChange={(e) =>
            setProjectData({ ...projectData, projectName: e.target.value })
          }
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
          value={projectData.startDate}
          className={`w-full mb-4 p-2 border`}
          onChange={(e) =>
            setProjectData({
              ...projectData,
              startDate: e.target.value,
            })
          }
        />
        
        <input
          type="date"
          placeholder="End Date"
          className={`w-full mb-4 p-2 border ${
            isCurrentlyWorking ? "bg-gray-200" : ""
          }`}
          disabled={isCurrentlyWorking || !mode}
          value={projectData.endDate}
          onChange={(e) =>
            setProjectData({ ...projectData, endDate: e.target.value })
          }
        />

        <h3 className="text-gray-600 text-sm font-semibold mb-2">
          Skills
        </h3>
        
        <div className="w-full mb-4 flex flex-wrap">
          {skills.map((skill, index) => (
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
            value={newSkill}
            onChange={handleChangeSkill}
            onKeyPress={handleSkillInputChange}
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
          value={projectData.description}
          onChange={(e) =>
            setProjectData({ ...projectData, description: e.target.value })
          }
        />
        
        <input
          type="text"
          placeholder="Host Url"
          className="w-full mb-4 p-2 border"
          disabled={!mode}
          value={projectData.hostUrl}
          onChange={(e) =>
            setProjectData({ ...projectData, hostUrl: e.target.value })
          }
        />
        
        <input
          type="text"
          placeholder="Git repository Url"
          className="w-full mb-4 p-2 border"
          disabled={!mode}
          value={projectData.gitUrl}
          onChange={(e) =>
            setProjectData({ ...projectData, gitUrl: e.target.value })
          }
        />
        
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

export default ProjectExperiencePopup;