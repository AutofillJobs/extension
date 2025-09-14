import React, { useEffect, useState } from 'react';
import { SavedJob } from "../contentScript/utils/types";

const AnalyticsPage = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["analyticsJobs"], (result) => {
      setSavedJobs(result.analyticsJobs || []);
    });
  }, []);
  return (
    <div className="bg-white rounded-xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Analytics Dashboard</h2>
      <div className="space-y-8">
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Application Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <span className="block text-3xl font-bold text-blue-500 mb-2">24</span>
              <span className="text-sm text-gray-600">Applications Submitted</span>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <span className="block text-3xl font-bold text-green-500 mb-2">8</span>
              <span className="text-sm text-gray-600">Interviews Scheduled</span>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <span className="block text-3xl font-bold text-purple-500 mb-2">3</span>
              <span className="text-sm text-gray-600">Offers Received</span>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <span className="block text-3xl font-bold text-orange-500 mb-2">85%</span>
              <span className="text-sm text-gray-600">Profile Completion</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Saved Jobs</h3>
          {savedJobs.length === 0 ? (
            <p className="text-gray-500">No jobs saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 font-medium text-gray-700">Title</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Date Added</th>
                    <th className="px-3 py-2 font-medium text-gray-700">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {savedJobs.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{job.title}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{new Date(job.dateAdded).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View Job
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-sm text-gray-500">2 hours ago</span>
              <span className="font-medium text-gray-800">Application submitted to Google</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-sm text-gray-500">1 day ago</span>
              <span className="font-medium text-gray-800">Interview scheduled with Microsoft</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-sm text-gray-500">3 days ago</span>
              <span className="font-medium text-gray-800">Profile updated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 