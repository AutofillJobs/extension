import React, { useState, useEffect } from 'react';
import WorkExperiencePopup from './WorkExperiencePopup';
import ProjectExperience from "./ProjectExperience";
import EducationExperiencePopup from './EducationExperience';
import ProjectExperienceDisplay from "./ProjectExperienceDisplay";
import WorkExperienceDisplay from "./WorkExperienceDisplay";
import EducationExperienceDisplay from "./EducationExperienceDisplay";
import './Experience.css';
import { getUserData } from '../../utils/storageHandler';

// Additional Skills Popup Component (stores separately in chrome.storage.local)
const AdditionalSkillsPopup = ({ onClose, onSave }) => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [existingSkills, setExistingSkills] = useState([]);

  useEffect(() => {
    try {
      chrome.storage.local.get(['additionalSkills'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading additional skills:', chrome.runtime.lastError);
          return;
        }
        setExistingSkills(result?.additionalSkills || []);
      });
    } catch (e) {
      console.error('chrome.storage not available:', e);
    }
  }, []);

  const handleChangeSkill = (e) => setNewSkill(e.target.value);

  const handleAddSkill = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newSkill.trim()) {
      e.preventDefault?.();
      const trimmed = newSkill.trim();
      if (!skills.includes(trimmed) && !existingSkills.includes(trimmed)) {
        setSkills((prev) => [...prev, trimmed]);
      }
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingSkill = (index) => {
    setExistingSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (event) => {
    event.preventDefault();
    const allSkills = [...new Set([...existingSkills, ...skills])];

    try {
      chrome.storage.local.set({ additionalSkills: allSkills }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving additional skills:', chrome.runtime.lastError);
          return;
        }
        onSave?.();
        onClose?.();
      });
    } catch (e) {
      console.error('chrome.storage not available:', e);
    }
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white w-full md:w-96 p-6 rounded-lg shadow-xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold mb-4">Additional Skills</h2>
          <button className="text-gray-600 mb-4 text-2xl" onClick={onClose}>×</button>
        </div>

        {existingSkills.length > 0 && (
          <>
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Current Skills</h3>
            <div className="w-full mb-4 flex flex-wrap">
              {existingSkills.map((skill, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 text-sm rounded-full px-3 py-1 mr-2 mb-2 flex items-center">
                  {skill}
                  <button
                    onClick={() => handleRemoveExistingSkill(index)}
                    className="ml-2 text-xs font-semibold focus:outline-none hover:text-red-600"
                  >×</button>
                </div>
              ))}
            </div>
          </>
        )}

        {skills.length > 0 && (
          <>
            <h3 className="text-gray-600 text-sm font-semibold mb-2">New Skills to Add</h3>
            <div className="w-full mb-4 flex flex-wrap">
              {skills.map((skill, index) => (
                <div key={index} className="bg-green-100 text-green-800 text-sm rounded-full px-3 py-1 mr-2 mb-2 flex items-center">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(index)}
                    className="ml-2 text-xs font-semibold focus:outline-none hover:text-red-600"
                  >×</button>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="text-gray-600 text-sm font-semibold mb-2">Add New Skill</h3>
        <div className="mb-4 flex">
          <input
            type="text"
            placeholder="Enter skill name"
            className="p-2 border rounded-lg flex-grow"
            value={newSkill}
            onChange={handleChangeSkill}
            onKeyDown={handleAddSkill}
          />
          <button
            className="bg-gray-800 text-white px-4 py-2 rounded-lg ml-2 hover:bg-gray-700"
            onClick={handleAddSkill}
          >Add</button>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleSave}
            className="bg-black text-white px-6 py-2 rounded-lg mr-4 hover:bg-gray-800"
          >Save</button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-black px-6 py-2 rounded-lg hover:bg-gray-300"
          >Cancel</button>
        </div>
      </div>
    </div>
  );
};

// Skills Card Component (aggregates experience skills + additionalSkills from storage)
const SkillsCard = ({ experience, refreshKey }) => {
  const [experienceSkills, setExperienceSkills] = useState([]);
  const [additionalSkills, setAdditionalSkills] = useState([]);

  // Collect skills from experiences
  useEffect(() => {
    const skillsSet = new Set<string>();

    const addSkills = (skillField: any) => {
      if (!skillField) return;
      if (Array.isArray(skillField)) {
        skillField.forEach((s) => addSkills(s));
      } else if (typeof skillField === "string") {
        skillField.split(",").forEach((raw) => {
          const s = raw.trim();
          if (s) skillsSet.add(s);
        });
      }
    };

    experience?.workExperiences?.forEach((w) => addSkills(w?.skills));
    experience?.projectExperiences?.forEach((p) => addSkills(p?.skills));
    experience?.educationExperiences?.forEach((e) => addSkills(e?.skills));

    setExperienceSkills(Array.from(skillsSet).sort());
  }, [experience]);

  // Load additional skills from chrome storage and listen for changes
  useEffect(() => {
    const loadAdditional = () => {
      try {
        chrome.storage.local.get(['additionalSkills'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error loading additional skills:', chrome.runtime.lastError);
            return;
          }
          setAdditionalSkills(result?.additionalSkills || []);
        });
      } catch (e) {
        console.error('chrome.storage not available:', e);
      }
    };

    loadAdditional();

    const onChanged = (changes, area) => {
      if (area === 'local' && changes.additionalSkills) {
        setAdditionalSkills(changes.additionalSkills.newValue || []);
      }
    };

    try {
      chrome.storage.onChanged.addListener(onChanged);
    } catch (e) {
      // ignore if not in extension context
    }

    return () => {
      try {
        chrome.storage.onChanged.removeListener(onChanged);
      } catch {}
    };
  }, [refreshKey]);

  const totalSkills = [...new Set([...(experienceSkills || []), ...(additionalSkills || [])])];
  if (!totalSkills.length) return null;

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-700 pb-2">All Skills ({totalSkills.length})</h2>
      <div className="bg-gray-50 p-3 rounded-lg">
        {experienceSkills.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-600 mb-2">From Experiences</h4>
            <div className="flex flex-wrap gap-2">
              {experienceSkills.map((skill, idx) => (
                <span key={`exp-${idx}`} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {additionalSkills.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Additional Skills</h4>
            <div className="flex flex-wrap gap-2">
              {additionalSkills.map((skill, idx) => (
                <span key={`add-${idx}`} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Experience({ experience: incomingExperience }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [experience, setExperience] = useState(incomingExperience);
  const [selectedDisplayOption, setSelectedDisplayOption] = useState({
    type: "",
    data: null,
    selected: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  // update local state whenever parent passes new experience
  React.useEffect(() => {
    setExperience(incomingExperience);
  }, [incomingExperience]);
  const toggleDropdown = () => setIsOpen((v) => !v);

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
    <div className="w-full md:w-96 md:max-w-full mx-auto">
      <div className="p-6">
        <div className="relative inline-block text-left">
          <div>
            <button
              type="button"
              className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={toggleDropdown}
            >
              ADD
              <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {isOpen && (
              <div className="absolute right-5 z-10 mt-2 ml-10 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1" role="none">
                  <div className="text-gray-700 block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100" onClick={() => handleOptionClick("Work")}>Work</div>
                  <div className="text-gray-700 block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100" onClick={() => handleOptionClick("Education")}>Education</div>
                  <div className="text-gray-700 block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100" onClick={() => handleOptionClick("Project")}>Project</div>
                  <div className="text-gray-700 block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100" onClick={() => handleOptionClick("Skills")}>Additional Skills</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skills Card */}
        <SkillsCard experience={experience} refreshKey={refreshKey} />

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-1">Work Experiences</h2>
          <div className="grid gap-2 rounded">
            {experience?.workExperiences?.map((workExp) => (
              <div
                key={workExp.id}
                onClick={() => {
                  setSelectedDisplayOption({ type: "Work", data: workExp, selected: true });
                }}
                className="bg-gray-100 p-2 cursor-pointer hover:bg-gray-200"
              >
                <p className="text-black">{workExp.jobTitle} : {workExp.companyName}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-1">Project Experiences</h2>
          <div className="grid gap-2 rounded">
            {experience?.projectExperiences?.map((projectExp) => (
              <div
                key={projectExp.id}
                onClick={() => {
                  setSelectedDisplayOption({ type: "Project", data: projectExp, selected: true });
                }}
                className="bg-gray-100 p-2 cursor-pointer hover:bg-gray-200"
              >
                <p className="text-black">Project: {projectExp.projectName}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-1">Education Experiences</h2>
          <div className="grid gap-2 rounded">
            {experience?.educationExperiences?.map((eduExp) => (
              <div
                key={eduExp.id}
                onClick={() => {
                  setSelectedDisplayOption({ type: "Education", data: eduExp, selected: true });
                }}
                className="bg-gray-100 p-2 cursor-pointer hover:bg-gray-200"
              >
                <p className="text-black">{eduExp.courseName} : {eduExp.collegeName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDisplayOption.selected && selectedDisplayOption?.type === "Project" && (
        <ProjectExperienceDisplay
          data={selectedDisplayOption.data}
          mode={true}
          onClose={() => setSelectedDisplayOption({ selected: false, data: null, type: "" })}
          onSave={handleRefresh}
        />
      )}

      {selectedDisplayOption.selected && selectedDisplayOption?.type === "Work" && (
        <WorkExperienceDisplay
          data={selectedDisplayOption.data}
          mode={true}
          onClose={() => setSelectedDisplayOption({ selected: false, data: null, type: "" })}
          onSave={handleRefresh}
        />
      )}

      {selectedDisplayOption.selected && selectedDisplayOption?.type === "Education" && (
        <EducationExperienceDisplay
          data={selectedDisplayOption.data}
          mode={true}
          onClose={() => setSelectedDisplayOption({ selected: false, data: null, type: "" })}
          onSave={handleRefresh}
        />
      )}

      {selectedOption === "Work" && (
        <WorkExperiencePopup
          mode={true}
          onClose={() => setSelectedOption(null)}
          onSave={handleRefresh}
        />
      )}

      {selectedOption === "Education" && (
        <EducationExperiencePopup
          mode={true}
          onClose={() => setSelectedOption(null)}
          onSave={handleRefresh}
        />
      )}

      {selectedOption === "Project" && (
        <ProjectExperience
          mode={true}
          onClose={() => setSelectedOption(null)}
          onSave={handleRefresh}
        />
      )}

      {selectedOption === "Skills" && (
        <AdditionalSkillsPopup
          onClose={() => setSelectedOption(null)}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
}