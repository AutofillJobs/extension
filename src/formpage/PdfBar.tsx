import React, { useState, useEffect } from 'react';
import { FaFilePdf } from 'react-icons/fa';

const DownloadBar = ({ fileName,fileUrl, type }) => {
  
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
  href={fileUrl}
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
