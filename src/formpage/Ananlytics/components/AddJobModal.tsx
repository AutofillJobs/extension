import React, { useState } from 'react';

interface AddJobModalProps {
  onClose: () => void;
  onSubmit: (newApp: any) => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ onClose, onSubmit }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [companyLink, setCompanyLink] = useState('');
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !companyLink || !dateApplied) {
      alert('Please fill in all required fields.');
      return;
    }
    onSubmit({ jobTitle, jobLink, companyLink, status: 'Applied', dateApplied });
    onClose();
  };

  return (
    <div id="modalBg">
      <div id="modalContent">
        <h2>Add Job Application</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Job Title</label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Job Link</label>
            <input value={jobLink} onChange={e => setJobLink(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Company Website</label>
            <input value={companyLink} onChange={e => setCompanyLink(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Application Date</label>
            <input type="date" value={dateApplied} onChange={e => setDateApplied(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobModal;
