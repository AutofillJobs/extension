import React, { useState, useEffect } from 'react';
import { getUserData, saveUserData } from '../utils/storageHandler';

const EducationExperiencePopup = ({ onClose, mode ,onSave}) => {
  // const [showSkillInput, setShowSkillInput] = useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
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
  });
  const [isCurrentlyStudying, setIsCurrentlyStudying] = useState(educationData.stillStudying);

  useEffect(() => {
    getUserData((userData) => {
      if (userData && userData.educationExperiences) {
        // If you want to edit an existing experience, you would need to pass an ID prop
        // and then find the specific experience here
      }
    });
  }, []);

  const handleCurrentlyStudyingChange = (e) => {
    setIsCurrentlyStudying(e.target.checked);
    setEducationData({ ...educationData, stillStudying: e.target.checked });
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
    const updatedSkills = skills.filter((_, i) => i !== index);
    setSkills(updatedSkills);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const updatedEducationData = {
      ...educationData,
      skills: skills,
      id: Date.now(), // Generate a unique ID
    };

    getUserData((userData) => {
      const existingFormData = userData?.data || {};
      const existingEducationExperiences = existingFormData.educationExperiences || [];
      
      const updatedFormData = {
        data:{
        ...existingFormData,
        educationExperiences: [...existingEducationExperiences, updatedEducationData],
        }
      };

      saveUserData(updatedFormData, (success, error) => {
        if (success) {
          console.log('Education experience data saved');
          onClose();
          onSave();
        } else {
          console.error('Error saving education experience:', error);
        }
      });
    });
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white w-full md:w-96 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between item-center">
          <h2 className="text-2xl font-semibold mb-4">Education Experience</h2>
          <button className="text-gray-600 mb-4 text-2xl" onClick={onClose}>
            X
          </button>
        </div>

        <input
          type="text"
          placeholder="Course Name"
          className="w-full mb-4 p-2 border"
          value={educationData.courseName}
          disabled={!mode}
          onChange={(e) =>
            setEducationData({ ...educationData, courseName: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Field"
          className="w-full mb-4 p-2 border"
          value={educationData.field}
          disabled={!mode}
          onChange={(e) =>
            setEducationData({ ...educationData, field: e.target.value })
          }
        />
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            className="mr-2"
            disabled={!mode}
            checked={isCurrentlyStudying}
            onChange={handleCurrentlyStudyingChange}
          />
          Currently Studying
        </label>
        <input
          type="date"
          placeholder="Start Date"
          disabled={!mode}
          value={educationData.startDate}
          className={`w-full mb-4 p-2 border`}
          onChange={(e) =>
            setEducationData({
              ...educationData,
              startDate: e.target.value,
            })
          }
        />
        <input
          type="date"
          placeholder="End Date"
          className={`w-full mb-4 p-2 border ${
            isCurrentlyStudying ? "bg-gray-200" : ""
          }`}
          disabled={isCurrentlyStudying || !mode}
          value={educationData.endDate}
          onChange={(e) =>
            setEducationData({ ...educationData, endDate: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="College/University/Platform"
          className="w-full mb-4 p-2 border"
          disabled={!mode}
          value={educationData.collegeName}
          onChange={(e) =>
            setEducationData({ ...educationData, collegeName: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Grade"
          className="w-full mb-4 p-2 border"
          disabled={!mode}
          value={educationData.grade}
          onChange={(e) =>
            setEducationData({ ...educationData, grade: e.target.value })
          }
        />

        <select
          className="mb-4 py-2 px-4 border"
          value={educationData.educationType}
          onChange={(e) => {
            setEducationData({
              ...educationData,
              educationType: e.target.value,
            });
          }}
        >
          <option value="">Education type</option>
          <option value="School Education">School Education</option>
          <option value="Higher Education">Higher Education</option>
          <option value="Online Education">Online Education</option>
        </select>

        {educationData.educationType !== "Online Education" && (
          <input
            type="text"
            placeholder="Location"
            className="w-full mb-4 p-2 border"
            disabled={!mode}
            value={educationData.location}
            onChange={(e) =>
              setEducationData({ ...educationData, location: e.target.value })
            }
          />
        )}

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
              onChange={handleChangeSkill}
            />
            <button
              className="bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 ml-2"
              onClick={handleSkillInputChange}
            >
              Add
            </button>
          </div>
        

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

export default EducationExperiencePopup;