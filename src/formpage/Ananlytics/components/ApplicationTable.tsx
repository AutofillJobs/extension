import React from 'react';

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

const statusOptions = ["Applied", "Screen", "Interviewing", "Offer", "Rejected", "Archived"];

const ApplicationTable: React.FC<ApplicationTableProps> = ({ apps, onStatusChange }) => {
  return (
    <section>
      <table>
        <thead >
          <tr className='table-header'>
            <th>Job Title</th>
            <th>Company Link</th>
            <th>Status</th>
            <th>Date Applied</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {apps.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className="empty-message">
                  Your submitted job applications will appear here.
                  <a href="#">Click here to create your application profile.</a>
                </div>
              </td>
            </tr>
          ) : (
            apps.map((app, index) => (
              <tr key={index} className='table-row'>
                <td>
                  {app.jobLink?.trim() ? (
                    <a href={app.jobLink} target="_blank" rel="noopener noreferrer">
                      {app.jobTitle}
                    </a>
                  ) : (
                    app.jobTitle
                  )}
                </td>
                <td>
                  <a href={app.companyLink} target="_blank" rel="noopener noreferrer">
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
            ))
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ApplicationTable;