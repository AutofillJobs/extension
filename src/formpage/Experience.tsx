import React, { useState, useEffect } from 'react';
import WorkExperiencePopup from './WorkExperiencePopup';
import ProjectExperience from "./ProjectExperience";
import EducationExperiencePopup from './EducationExperience';
import ProjectExperienceDisplay from "./ProjectExperienceDisplay";
import WorkExperienceDisplay from "./WorkExperienceDisplay";
import EducationExperienceDisplay from "./EducationExperienceDisplay";
import './Experience.css'

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
    chrome.storage.local.get(['formData'], (result) => {
      if (result.formData) {
        setExperience(result.formData.data.details);
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
              <svg
                className="-mr-1 h-5 w-5 text-gray-400"
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
          </div>
          <div className="flex flex-col gap-4">
            {isOpen && (
              <div className="absolute right-5 z-10 mt-2 ml-10 w-24 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1" role="none">
                  <div
                    className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
                    onClick={() => handleOptionClick("Work")}
                  >
                    Work
                  </div>
                  <div
                    className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
                    onClick={() => handleOptionClick("Education")}
                  >
                    Education
                  </div>
                  <div
                    className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
                    onClick={() => handleOptionClick("Project")}
                  >
                    Project
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-1">
            Work Experiences
          </h2>
          <div className="grid gap-2 rounded">
            {experience?.workExperiences?.map((workExp) => (
              <div
                key={workExp.id}
                onClick={() => {
                  setSelectedDisplayOption({
                    type: "Work",
                    data: workExp,
                    selected: true,
                  });
                }}
                className="bg-gray-100 p-2 cursor-pointer"
              >
                <p className="text-black">
                  {workExp.jobTitle} : {workExp.companyName}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 pb1">
            Project Experiences
          </h2>
          <div className="grid gap-2 rounded">
            {experience?.projectExperiences?.map((projectExp) => (
              <div
                key={projectExp.id}
                onClick={() => {
                  setSelectedDisplayOption({
                    type: "Project",
                    data: projectExp,
                    selected: true,
                  });
                }}
                className="bg-gray-100 p-2 cursor-pointer"
              >
                <p className="text-black">Project: {projectExp.projectName}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Education Experiences
          </h2>
          <div className="grid gap-2 rounded ">
            {experience?.educationExperiences?.map((eduExp) => (
              <div
                key={eduExp.id}
                onClick={() => {
                  setSelectedDisplayOption({
                    type: "Education",
                    data: eduExp,
                    selected: true,
                  });
                }}
                className="bg-gray-100 p-2 cursor-pointer"
              >
                <p className="text-black">
                  {eduExp.courseName} : {eduExp.collegeName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

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






// import React, { useState, useEffect } from 'react';
// import WorkExperiencePopup from './WorkExperiencePopup';
// import ProjectExperience from "./ProjectExperience";
// import EducationExperiencePopup from './EducationExperience';
// import ProjectExperienceDisplay from "./ProjectExperienceDisplay";
// import WorkExperienceDisplay from "./WorkExperienceDisplay";
// import EducationExperienceDisplay from "./EducationExperienceDisplay";
// import './Experience.css'
// export default function Educational({}) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedOption, setSelectedOption] = useState(null);
//   const [experience, setExperience] = useState(null);
//   const [selectedDisplayOption, setSelectedDisplayOption] = useState({
//     type: "",
//     id: "",
//     selected: false,
//   });

//   const [refreshKey, setRefreshKey] = useState(0);

//   const handleRefresh = () => {
//     console.log("change");
//     setRefreshKey((prevKey) => prevKey + 1);
//   };

//   const toggleDropdown = () => {
//     setIsOpen(!isOpen);
//   };

//   const userId = 1;
//   useEffect(() => {
//     chrome.storage.local.get(['formData'], (result) => {
//       if (result.formData) {
//         setExperience(result.formData.data);
//       }
//     });
//   }, [refreshKey]);

  

//   const handleOptionClick = (option) => {
//     setSelectedOption(option);
//     console.log("Selected Option:", option);
//     setIsOpen(false);
//   };

//   return (
//   <div className="w-full md:w-96 md:max-w-full mx-auto">
//   <div className="p-6">
//         <div className="relative inline-block text-left">
//           <div>
//             <button
//               type="button"
//               className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
//               onClick={toggleDropdown}
//             >
//               ADD
//               <svg
//                 className="-mr-1 h-5 w-5 text-gray-400"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//                 aria-hidden="true"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//             </button>
//           </div>
//           <div className="flex flex-col gap-4">
//           {isOpen && (
//             <div className="absolute right-5 z-10 mt-2 ml-10 w-24 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//               <div className="py-1" role="none">
//                 <div
//                   className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
//                   onClick={() => handleOptionClick("Work")}
//                 >
//                   Work
//                 </div>
//                 <div
//                   className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
//                   onClick={() => handleOptionClick("Education")}
//                 >
//                   Education
//                 </div>
//                 <div
//                   className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
//                   onClick={() => handleOptionClick("Project")}
//                 >
//                   Project
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//         </div>
     
//         <div className="p-4">
//           <h2 className="text-sm font-semibold text-gray-700 pb-1">
//             Work Experiences
//           </h2>
//           <div className="grid gap-2 rounded">
//             {experience?.workExperiences?.map((workExp) => (
//               <div
//                 key={workExp.id}
//                 onClick={() => {
//                   setSelectedDisplayOption({
//                     type: "Work",
//                     id: workExp.id,
//                     selected: true,
//                   });
//                 }}
//                 className="bg-gray-100 p-2 cursor-pointer"
//               >
//                 <p className="text-black">
//                   {workExp.jobTitle} : {workExp.companyName}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="p-4">
//           <h2 className="text-sm font-semibold text-gray-700 pb1">
//             Project Experiences
//           </h2>
//           <div className="grid gap-2 rounded">
//             {experience?.projectExperiences?.map((projectExp) => (
//               <div
//                 key={projectExp.id}
//                 onClick={() => {
//                   setSelectedDisplayOption({
//                     type: "Project",
//                     id: projectExp.id,
//                     selected: true,
//                   });
//                 }}
//                 className="bg-gray-100 p-2 cursor-pointer"
//               >
//                 <p className="text-black">Project: {projectExp.projectName}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="p-4">
//           <h2 className="text-sm font-semibold text-gray-700">
//             Education Experiences
//           </h2>
//           <div className="grid gap-2 rounded ">
//             {experience?.educationExperiences?.map((eduExp) => (
//               <div
//                 key={eduExp.id}
//                 onClick={() => {
//                   setSelectedDisplayOption({
//                     type: "Education",
//                     id: eduExp.id,
//                     selected: true,
//                   });
//                 }}
//                 className="bg-gray-100 p-2 cursor-pointer"
//               >
//                 <p className="text-black">
//                   {eduExp.courseName} : {eduExp.collegeName}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {selectedDisplayOption.selected && selectedDisplayOption?.type === "Project" && (
//         <ProjectExperienceDisplay
//           id={selectedDisplayOption.id}
//           mode={true}
//           onClose={() => {
//             setSelectedDisplayOption({ selected: false, id: "", type: "" });
           
//           }}
//           onSave={handleRefresh}
//         />
//       )}
//       {selectedDisplayOption.selected && selectedDisplayOption?.type === "Work" && (
//         <WorkExperienceDisplay
//           id={selectedDisplayOption.id}
//           mode={true}
//           onClose={() => {
//             setSelectedDisplayOption({ selected: false, id: "", type: "" });
           
//           }}
//           onSave={handleRefresh}
//         />
//       )}
//       {selectedDisplayOption.selected && selectedDisplayOption?.type === "Education" && (
//         <EducationExperienceDisplay
//           id={selectedDisplayOption.id}
//           mode={true}
//           onClose={() => {
//             setSelectedDisplayOption({ selected: false, id: "", type: "" });
         
//           }}
//           onSave={handleRefresh}
//         />
//       )}

//       {selectedOption === "Work" && (
//         <WorkExperiencePopup
//           mode={true}
//           onClose={() => {
//             setSelectedOption(null);
           
//           }}
//           onSave={handleRefresh}
//         />
//       )}
//       {selectedOption === "Education" && (
//         <EducationExperiencePopup
//           mode={true}
//           onClose={() => {
//             setSelectedOption(null);
          
//           }}
//           onSave={handleRefresh}
//         />
//       )}
//       {selectedOption === "Project" && (
//         <ProjectExperience
//           mode={true}
//           onClose={() => {
//             setSelectedOption(null);
//           }}
//           onSave={handleRefresh}
//         />
//       )}
//     </div>
//   );
// }