import React, { useState } from 'react';
import LinkedInCredentialsSetup from '../server/LinkedInCredentialsSetup';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoSave: true,
    darkMode: false,
    language: 'English'
  });

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Settings</h2>
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="font-medium text-gray-700">Email Notifications</span>
            </label>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Application</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="font-medium text-gray-700">Auto-save forms</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="font-medium text-gray-700">Dark Mode</span>
            </label>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">LinkedIn Integration</h3>
          <div className="space-y-3">
            <LinkedInCredentialsSetup 
              onCredentialsSet={(success, error) => {
                if (success) {
                  console.log('LinkedIn credentials configured successfully');
                } else {
                  console.error('Failed to configure LinkedIn credentials:', error);
                }
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Language</h3>
          <div className="space-y-3">
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 