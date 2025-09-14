import React, { useEffect, useState } from "react";

interface SavedJob {
  id: string;
  title: string;
  url: string;
  dateAdded: string;
  status?: string;
}

interface Application {
  jobTitle: string;
  companyLink: string;
  jobLink?: string;
  status: string;
  dateApplied: string;
}

interface ApplicationTableProps {
  apps: Application[];
  onStatusChange: (index: number, newStatus: string) => void;
}

const statusOptions = [
  "Applied",
  "Screen",
  "Interviewing",
  "Offer",
  "Rejected",
  "Archived",
];

const ApplicationTable: React.FC<ApplicationTableProps> = ({
  apps,
  onStatusChange,
}) => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["savedJobsAnalytics"], (result) => {
      const jobs = result.savedJobsAnalytics || [];
      // Set default status for saved jobs if not present
      const jobsWithStatus = jobs.map((job: SavedJob) => ({
        ...job,
        status: job.status || 'Applied'
      }));
      setSavedJobs(jobsWithStatus);
    });
  }, []);

  // Handle saved job status change
  const handleSavedJobStatusChange = (jobIndex: number, newStatus: string) => {
    const updatedSavedJobs = [...savedJobs];
    updatedSavedJobs[jobIndex].status = newStatus;
    setSavedJobs(updatedSavedJobs);
    
    // Update storage
    chrome.storage.local.set({ savedJobsAnalytics: updatedSavedJobs }, () => {
      console.log('Saved job status updated:', updatedSavedJobs[jobIndex]);
    });
  };

  return (
    <section>
      <table>
        <thead>
          <tr className="table-header">
            <th>Job Title</th>
            <th>Company Link</th>
            <th>Status</th>
            <th>Date Applied</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {/* Application Rows */}
          {apps.length > 0 &&
            apps.map((app, index) => (
              <tr key={index} className="table-row">
                <td>
                  {app.jobLink?.trim() ? (
                    <a
                      href={app.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {app.jobTitle}
                    </a>
                  ) : (
                    app.jobTitle
                  )}
                </td>
                <td>
                  <a
                    href={app.companyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {app.companyLink}
                  </a>
                </td>
                <td>
                    <label htmlFor={`status-select-${index}`} className="sr-only">Status</label>
                  <select
                      id={`status-select-${index}`}
                      aria-label="Application status"
                    className="status-dropdown"
                    value={app.status}
                    onChange={(e) => onStatusChange(index, e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{app.dateApplied}</td>
                <td></td>
              </tr>
            ))}
          {/* Saved Job Rows */}
          {savedJobs.length > 0 &&
            savedJobs.map((job, jobIndex) => (
              <tr key={`saved-${job.id}`} className="table-row saved-job-row">
                <td>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    {job.title}
                  </a>
                </td>
                <td>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    {job.url}
                  </a>
                </td>
                <td>
                  <select
                    className="status-dropdown"
                    value={job.status || 'Applied'}
                    onChange={(e) => handleSavedJobStatusChange(jobIndex, e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(job.dateAdded).toLocaleDateString('en-GB')}</td>
                <td></td>
              </tr>
            ))}
          {/* If no applications and no saved jobs, show placeholder */}
          {apps.length === 0 && savedJobs.length === 0 && (
            <tr>
              <td colSpan={5}>
                <div className="empty-message">
                  Your submitted job applications will appear here.
                  <a href="#">Click here to create your application profile.</a>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

// Add styles for saved jobs table integration
const savedJobsStyles = `
  .saved-job-row {
    background-color: #f9fafb;
  }

  .saved-job-row:hover {
    background-color: #f3f4f6;
  }

  .saved-job-row a {
    color: #000;
    text-decoration: none;
  }

  .saved-job-row a:hover {
    color: #000;
    text-decoration: underline;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = savedJobsStyles;
  document.head.appendChild(styleElement);
}

export default ApplicationTable;
