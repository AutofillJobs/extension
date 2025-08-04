import React, { useState } from 'react';
import FormPage from './formpage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import FeedbackPage from './FeedbackPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState('profile');
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com'
  });

  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return <FormPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'feedback':
        return <FeedbackPage />;
      default:
        return <FormPage />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} />

      {/* Main Content */}
      <main className="flex-1 p-8  mx-auto w-full">
        {renderPage()}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
