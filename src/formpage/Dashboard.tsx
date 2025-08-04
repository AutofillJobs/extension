import React, { useState } from 'react';
import FormPage from './formpage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import FeedbackPage from './FeedbackPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const ComingSoon = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Coming Soon!</h2>
      <p className="text-gray-600 max-w-md">
        We're working hard to bring you this feature. Stay tuned for updates!
      </p>
    </div>
  );
};



const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState('profile');
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com'
  });



  // const renderPage = () => {
  //   switch (currentPage) {
  //     case 'profile':
  //       return <FormPage />;
  //     case 'analytics':
  //       return <AnalyticsPage />;
  //     case 'settings':
  //       return <SettingsPage />;
  //     case 'feedback':
  //       return <FeedbackPage />;
  //     default:
  //       return <FormPage />;
  //   }
  // };

  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return <FormPage />;
      case 'analytics':
        return <ComingSoon />;
      case 'settings':
        return <ComingSoon />;
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
