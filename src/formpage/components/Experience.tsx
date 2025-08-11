import React, { useState, useEffect } from 'react';
import WorkExperiencePopup from './WorkExperiencePopup';
import ProjectExperience from "./ProjectExperience";
import EducationExperiencePopup from './EducationExperience';
import ProjectExperienceDisplay from "./ProjectExperienceDisplay";
import WorkExperienceDisplay from "./WorkExperienceDisplay";
import EducationExperienceDisplay from "./EducationExperienceDisplay";
import './Experience.css'
import { getUserData } from '../../utils/storageHandler';

export default function Experience() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [experience, setExperience] = useState(null);
  const [selectedDisplayOption, setSelectedDisplayOption] = useState({
    type: "",
    data: null,
    selected: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    getUserData((userData) => {
      if (userData) {
        setExperience(userData.data.details);
      }
    });
  }, [refreshKey]);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header with Add Button */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">My Experience</h1>
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-200"
              onClick={toggleDropdown}
            >
              Add Experience
              <svg
                className="-mr-1 h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            
            {isOpen && (
              <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1" role="none">
                  <button
                    className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors duration-150"
                    onClick={() => handleOptionClick("Work")}
                  >
                    Work Experience
                  </button>
                  <button
                    className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors duration-150"
                    onClick={() => handleOptionClick("Education")}
                  >
                    Education
                  </button>
                  <button
                    className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors duration-150"
                    onClick={() => handleOptionClick("Project")}
                  >
                    Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Experience Sections */}
        <div className="divide-y divide-gray-200">
          {/* Work Experience Section */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Work Experience</h2>
            </div>
            <div className="space-y-3">
              {experience?.workExperiences?.length > 0 ? (
                experience.workExperiences.map((workExp) => (
                  <div
                    key={workExp.id}
                    onClick={() => {
                      setSelectedDisplayOption({
                        type: "Work",
                        data: workExp,
                        selected: true,
                      });
                    }}
                    className="bg-gray-50 hover:bg-indigo-50 p-4 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-sm"
                  >
                    <h3 className="font-medium text-gray-900">{workExp.jobTitle}</h3>
                    <p className="text-sm text-gray-600">{workExp.companyName}</p>
                    {workExp.startDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(workExp.startDate).toLocaleDateString()} - {workExp.endDate ? new Date(workExp.endDate).toLocaleDateString() : 'Present'}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No work experience added yet</p>
              )}
            </div>
          </div>

          {/* Project Experience Section */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
            </div>
            <div className="space-y-3">
              {experience?.projectExperiences?.length > 0 ? (
                experience.projectExperiences.map((projectExp) => (
                  <div
                    key={projectExp.id}
                    onClick={() => {
                      setSelectedDisplayOption({
                        type: "Project",
                        data: projectExp,
                        selected: true,
                      });
                    }}
                    className="bg-gray-50 hover:bg-indigo-50 p-4 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-sm"
                  >
                    <h3 className="font-medium text-gray-900">{projectExp.projectName}</h3>
                    {projectExp.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{projectExp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No projects added yet</p>
              )}
            </div>
          </div>

          {/* Education Experience Section */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Education</h2>
            </div>
            <div className="space-y-3">
              {experience?.educationExperiences?.length > 0 ? (
                experience.educationExperiences.map((eduExp) => (
                  <div
                    key={eduExp.id}
                    onClick={() => {
                      setSelectedDisplayOption({
                        type: "Education",
                        data: eduExp,
                        selected: true,
                      });
                    }}
                    className="bg-gray-50 hover:bg-indigo-50 p-4 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-sm"
                  >
                    <h3 className="font-medium text-gray-900">{eduExp.courseName}</h3>
                    <p className="text-sm text-gray-600">{eduExp.collegeName}</p>
                    {eduExp.startDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(eduExp.startDate).toLocaleDateString()} - {eduExp.endDate ? new Date(eduExp.endDate).toLocaleDateString() : 'Present'}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No education added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals for displaying details */}
      {selectedDisplayOption.selected && selectedDisplayOption?.type === "Project" && (
        <ProjectExperienceDisplay
          data={selectedDisplayOption.data}
          mode={true}
          onClose={() => {
            setSelectedDisplayOption({ selected: false, data: null, type: "" });
          }}
          onSave={handleRefresh}
        />
      )}
      {selectedDisplayOption.selected && selectedDisplayOption?.type === "Work" && (
        <WorkExperienceDisplay
          data={selectedDisplayOption.data}
          mode={true}
          onClose={() => {
            setSelectedDisplayOption({ selected: false, data: null, type: "" });
          }}
          onSave={handleRefresh}
        />
      )}
      {selectedDisplayOption.selected && selectedDisplayOption?.type === "Education" && (
        <EducationExperienceDisplay
          data={selectedDisplayOption.data}
          mode={true}
          onClose={() => {
            setSelectedDisplayOption({ selected: false, data: null, type: "" });
          }}
          onSave={handleRefresh}
        />
      )}

      {/* Modals for adding new items */}
      {selectedOption === "Work" && (
        <WorkExperiencePopup
          mode={true}
          onClose={() => {
            setSelectedOption(null);
          }}
          onSave={handleRefresh}
        />
      )}
      {selectedOption === "Education" && (
        <EducationExperiencePopup
          mode={true}
          onClose={() => {
            setSelectedOption(null);
          }}
          onSave={handleRefresh}
        />
      )}
      {selectedOption === "Project" && (
        <ProjectExperience
          mode={true}
          onClose={() => {
            setSelectedOption(null);
          }}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
}