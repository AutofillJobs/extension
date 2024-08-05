import React, { useState, useEffect } from 'react';
import { FaFilePdf } from 'react-icons/fa';

const DownloadBar = ({ email, fileName, fileUrl, type }) => {
  console.log(fileName);
  const [url, setUrl] = useState(fileUrl);

  function generateFileName(email, fileType) {
    // Ensure the fileType is either 'cv' or 'resume'
    if (fileType !== 'cv' && fileType !== 'resume') {
        throw new Error("fileType must be either 'cv' or 'resume'");
    }
    
    // Determine the file extension based on the file type
    const extension = '.pdf';
    
    // Generate the file name
    const fileName = `${email}${fileType}${extension}`;
    
    return fileName;
}


async function fetchSasToken(blobName,type) {
  let url;

  if(type==='cv'){
     // const url = "http://localhost:5000/api/details/extension/sas/cv/" + blobName;
     url = "https://api.autofilljobs.com/details/extension/sas/cv/" + blobName;

   }
   else{
    // const url = "http://localhost:5000/api/details/extension/sas/resume/" + blobName;
     url = "https://api.autofilljobs.com/details/extension/sas/resume/" + blobName;

   }
  
  
   try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok ${response.statusText}`);
    }

    const sasToken = await response.text(); // Treat the response as text
    return sasToken;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
  }
  async function fillResume() {
    const resumename = generateFileName(email, 'resume');
    const sasresume = await fetchSasToken(resumename, 'resume');
    const link = `https://csg10032003669092c8.blob.core.windows.net/autofilljobs/resumes/${resumename}?${sasresume}`;
    setUrl(link);
  }

  async function fillCV() {
    const cvname = generateFileName(email, 'cv');
    const sascv = await fetchSasToken(cvname, 'cv');
    const link1 = `https://csg10032003669092c8.blob.core.windows.net/autofilljobs/cvs/${cvname}?${sascv}`;
    console.log(link1);
    setUrl(link1);
  }

  useEffect(() => {
    console.log("type",type,"url:",url);
    if (url===null) {
      if (type === 'resume') {
        fillResume();
      } else if (type === 'Coverletter') {
        fillCV();
      }
    }
  }, [url, type]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#ffffff',
      padding: '15px 20px',
      borderRadius: '10px',
      margin: '15px 0',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s',
    }}>
      <FaFilePdf size={28} color="#FF0000" />
      <a
        href={url}
        download={fileName}
        style={{
          marginLeft: '15px',
          fontWeight: 'bold',
          fontSize: '16px',
          color: '#007bff',
          textDecoration: 'none',
          transition: 'color 0.3s',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#0056b3'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#007bff'}
      >
        {fileName}
      </a>
    </div>
  );
};

export default DownloadBar;
