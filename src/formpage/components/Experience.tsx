import React, { useState, useEffect } from 'react';
import WorkExperiencePopup from './WorkExperiencePopup';
import ProjectExperience from "./ProjectExperience";
import EducationExperiencePopup from './EducationExperience';
import ProjectExperienceDisplay from "./ProjectExperienceDisplay";
import WorkExperienceDisplay from "./WorkExperienceDisplay";
import EducationExperienceDisplay from "./EducationExperienceDisplay";
import './Experience.css'
import { getUserData } from '../../utils/storageHandler';
import { getUniqueSkills } from '../../utils/getUniqueSkills';

interface ExperienceItem {
  id: string;
  skills?: string[];
  [key: string]: any; // For other dynamic properties
}

interface ExperienceData {
  workExperiences?: ExperienceItem[];
  educationExperiences?: ExperienceItem[];
  projectExperiences?: ExperienceItem[];
}

interface EditingSkillsState {
  id: string | null;
  type: string | null;
  skills: string[];
}

interface DisplayOptionState {
  type: string;
  data: ExperienceItem | null;
  selected: boolean;
}

const Experience = () => {
  const [state, setState] = useState({
    isDropdownOpen: false,
    selectedOption: null as string | null,
    experience: null as ExperienceData | null,
    selectedDisplayOption: {
      type: "",
      data: null,
      selected: false,
    } as DisplayOptionState,
    refreshKey: 0
  });

  const [editingSkills, setEditingSkills] = useState<EditingSkillsState>({
    id: null,
    type: null,
    skills: []
  });

  const [newSkillInput, setNewSkillInput] = useState('');

  const { isDropdownOpen, selectedOption, experience, selectedDisplayOption, refreshKey } = state;

  const uniqueSkills: string[] = getUniqueSkills(experience);

  const handleRefresh = () => {
    setState(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  };

  const toggleDropdown = () => {
    setState(prev => ({ ...prev, isDropdownOpen: !prev.isDropdownOpen }));
  };

  useEffect(() => {
    const fetchUserData = async () => {
      getUserData((userData) => {
        if (userData?.data?.details) {
          setState(prev => ({ ...prev, experience: userData.data.details }));
        }
      });
    };
    fetchUserData();
  }, [refreshKey]);

  const handleOptionClick = (option: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedOption: option,
      isDropdownOpen: false 
    }));
  };

  const handleDisplayOptionClick = (type: string, data: ExperienceItem) => {
    setState(prev => ({
      ...prev,
      selectedDisplayOption: {
        type,
        data,
        selected: true,
      }
    }));
  };

  const closeModal = () => {
    setState(prev => ({ 
      ...prev, 
      selectedOption: null,
      selectedDisplayOption: {
        type: "",
        data: null,
        selected: false,
      }
    }));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillInput.trim() && !editingSkills.skills.includes(newSkillInput.trim())) {
      setEditingSkills(prev => ({
        ...prev,
        skills: [...prev.skills, newSkillInput.trim()]
      }));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditingSkills(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const startEditingSkills = (id: string, type: string, currentSkills: string[] = []) => {
    setEditingSkills({
      id,
      type,
      skills: [...currentSkills]
    });
  };

  const cancelEditingSkills = () => {
    setEditingSkills({
      id: null,
      type: null,
      skills: []
    });
    setNewSkillInput('');
  };

  const saveSkills = () => {
    getUserData((userData) => {
      if (userData?.data?.details && editingSkills.id && editingSkills.type) {
        const updatedDetails = { ...userData.data.details };
        const experienceType = `${editingSkills.type.toLowerCase()}Experiences` as keyof ExperienceData;
        
        if (updatedDetails[experienceType]) {
          updatedDetails[experienceType] = updatedDetails[experienceType]!.map(exp => 
            exp.id === editingSkills.id 
              ? { ...exp, skills: editingSkills.skills } 
              : exp
          );

          const updatedData = {
            ...userData,
            data: {
              ...userData.data,
              details: updatedDetails
            }
          };

          chrome.storage.local.set({ formData: updatedData }, () => {
            handleRefresh();
            cancelEditingSkills();
          });
        }
      }
    });
  };

  const renderExperienceSection = (title: string, icon: JSX.Element, experiences?: ExperienceItem[], type: string) => (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <div className="bg-indigo-100 p-2 rounded-full mr-3">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="space-y-3">
        {experiences?.length ? (
          experiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-gray-50 hover:bg-indigo-50 p-4 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm"
            >
              <div 
                onClick={() => handleDisplayOptionClick(type, exp)}
                className="cursor-pointer"
              >
                <h3 className="font-medium text-gray-900">
                  {exp[type === 'Work' ? 'jobTitle' : type === 'Project' ? 'projectName' : 'courseName'] as string}
                </h3>
                <p className="text-sm text-gray-600">
                  {exp[type === 'Work' ? 'companyName' : type === 'Project' ? 'description' : 'collegeName'] as string}
                </p>
                {exp.startDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(exp.startDate as string).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate as string).toLocaleDateString() : 'Present'}
                  </p>
                )}
              </div>

              <div className="mt-3">
                {editingSkills.id === exp.id && editingSkills.type === type ? (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editingSkills.skills.map((skill, index) => (
                        <div key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full flex items-center">
                          {skill}
                          <button 
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 text-indigo-600 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                        placeholder="Add skill"
                        className="flex-1 text-sm border rounded px-2 py-1"
                      />
                      <button
                        onClick={handleAddSkill}
                        className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={cancelEditingSkills}
                        className="text-gray-500 text-sm px-3 py-1 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveSkills}
                        className="bg-indigo-600 text-white text-sm px-3 py-1 rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exp.skills?.map((skill, index) => (
                        <div key={index} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {skill}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => startEditingSkills(exp.id, type, exp.skills || [])}
                      className="text-indigo-600 text-xs mt-2 hover:underline"
                    >
                      {exp.skills?.length ? 'Edit Skills' : 'Add Skills'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm italic">No {title.toLowerCase()} added yet</p>
        )}
      </div>
    </div>
  );

  const workIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const projectIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  const educationIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );

  const modalComponents = {
    Work: WorkExperiencePopup,
    Education: EducationExperiencePopup,
    Project: ProjectExperience
  };

  const displayComponents = {
    Work: WorkExperienceDisplay,
    Education: EducationExperienceDisplay,
    Project: ProjectExperienceDisplay
  };

  const SelectedModal = selectedOption ? modalComponents[selectedOption as keyof typeof modalComponents] : null;
  const SelectedDisplay = selectedDisplayOption.selected ? displayComponents[selectedDisplayOption.type as keyof typeof displayComponents] : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">My Experience</h1>
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-200"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
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
            
            {isDropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1" role="menu">
                  {['Work', 'Education', 'Project'].map((option) => (
                    <button
                      key={option}
                      className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors duration-150"
                      onClick={() => handleOptionClick(option)}
                      role="menuitem"
                    >
                      {option} {option === 'Work' ? 'Experience' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Display unique skills section */}
        {uniqueSkills.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">All Skills</h2>
            <div className="flex flex-wrap gap-2">
              {uniqueSkills.map((skill, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {renderExperienceSection(
            'Work Experience',
            workIcon,
            experience?.workExperiences,
            'Work'
          )}
          {renderExperienceSection(
            'Projects',
            projectIcon,
            experience?.projectExperiences,
            'Project'
          )}
          {renderExperienceSection(
            'Education',
            educationIcon,
            experience?.educationExperiences,
            'Education'
          )}
        </div>
      </div>

      {SelectedModal && (
        <SelectedModal
          mode={true}
          onClose={closeModal}
          onSave={handleRefresh}
        />
      )}
      {SelectedDisplay && selectedDisplayOption.data && (
        <SelectedDisplay
          data={selectedDisplayOption.data}
          mode={true}
          onClose={closeModal}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
};

export default Experience;