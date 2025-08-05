import React, { useState, Suspense } from 'react';
import AnalyticsPage from './Ananlytics/ AnalyticsPage';
import SettingsPage from './SettingsPage';
import FeedbackPage from './FeedbackPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy load the FormPage component
const FormPage = React.lazy(() => import('./formpage'));

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
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading Form...</div>
            </div>
          }>
            <FormPage />
          </Suspense>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <ComingSoon />;
      case 'feedback':
        return <FeedbackPage />;
      default:
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading Form...</div>
            </div>
          }>
            <FormPage />
          </Suspense>
        );
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
