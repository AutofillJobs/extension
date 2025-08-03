import React from 'react';

const AnalyticsPage = () => {
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