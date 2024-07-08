import React, { useState, useEffect } from 'react';

const ProjectExperienceDisplay = ({ onClose, mode, id }) => {
  const [projectData, setProjectData] = useState({
    userId: "",
    projectName: "",
    startDate: "",
    endDate: "",
    stillWorking: false,
    description: "",
    gitUrl: "",
    hostUrl: "",
    skills: [],
  });

  useEffect(() => {
    // Fetch project data from Chrome local storage
    chrome.storage.local.get(['projectExperiences'], (result) => {
      const experiences = result.projectExperiences || [];
      const project = experiences.find(exp => exp.id === id);
      if (project) {
        setProjectData(project);
      }
    });
  }, [id]);

  const handleDiscard = () => {
    chrome.storage.local.get(['projectExperiences'], (result) => {
      const experiences = result.projectExperiences || [];
      const updatedExperiences = experiences.filter(exp => exp.id !== id);
      chrome.storage.local.set({ 'projectExperiences': updatedExperiences }, () => {
        console.log("Project Experience deleted successfully");
        onClose();
      });
    });
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white w-full md:w-96 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between item-center">
          <h2 className="text-gray-800 text-xl font-semibold mb-4">Project Experience</h2>
          <button className="text-gray-600 mb-4 text-xl" onClick={onClose}>
            X
          </button>
        </div>

        <p className="text-gray-600 text-lg mb-2">Project Name</p>
        <p className="w-full mb-2 p-2 border text-black">{projectData.projectName}</p>

        <label className="flex items-center mb-4">
          <span className="text-gray-600 text-lg">Currently Working</span>
        </label>
        
        <div className="flex my-4">
          <p className="text-gray-600 text-lg mb-2">Start Date</p>
          <p className="mb-2 ml-2 p-2 border text-black">{projectData.startDate}</p>
        </div>
        {!projectData.stillWorking && (
          <div className="flex my-4">
            <p className="text-gray-600 text-lg mb-2">End Date</p>
            <p className="mb-2 ml-2 p-2 border text-black">{projectData.endDate}</p>
          </div>
        )}

        <div className="w-full mb-4 flex flex-wrap">
          {projectData.skills?.map((skill, index) => (
            <div
              key={index}
              className="bg-gray-300 text-sm rounded-full px-3 py-1 mr-2 mb-2 flex items-center"
            >
              {skill}
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-lg mb-2">Description</p>
        <p className="w-full mb-4 p-2 border text-black">{projectData.description}</p>

        <p className="text-gray-600 text-lg mb-2">Host Url</p>
        <p className="w-full mb-4 p-2 border text-black">{projectData.hostUrl}</p>

        <p className="text-gray-600 text-lg mb-2">Git Url</p>
        <p className="w-full mb-4 p-2 border text-black">{projectData.gitUrl}</p>

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

export default ProjectExperienceDisplay;