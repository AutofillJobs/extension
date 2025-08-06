import React from 'react';

interface ControlsProps {
  onAdd: () => void;
  onUpload: (file: File) => void;
}

const Controls: React.FC<ControlsProps> = ({ onAdd, onUpload }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="controls">
      <button id="addJobBtn" onClick={onAdd}>+ Add Job</button>
      <label htmlFor="uploadJsonInput">Upload JSON</label>
      <input id="uploadJsonInput" type="file" accept=".json" onChange={handleFileUpload} />
    </div>
  );
};

export default Controls;
