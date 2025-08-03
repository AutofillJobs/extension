import React from 'react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: {
    name: string;
    email: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage, user }) => {
  const navItems = [
    { label: 'Analytics', key: 'analytics' },
    { label: 'Profile', key: 'profile' },
    { label: 'Settings', key: 'settings' },
  ];

  return (
    <nav
      className="w-full h-16 px-8 flex justify-between items-center sticky top-0 z-50"
      style={{
        background: 'linear-gradient(to right, #9333ea, #14b8a6)',
      }}
    >
      <div 
        className="text-white text-2xl font-abeezee font-bold cursor-pointer hover:text-white/90 transition-colors duration-200"
        onClick={() => window.open('https://applygoat.com/', '_blank')}
        title="Visit applyGOAT website"
      >
        applyGOAT
      </div>

      <div className="flex items-center">
        {navItems.map(({ label, key }) => (
          <React.Fragment key={key}>
            <div className='mr-4'>
            <button
              onClick={() => setCurrentPage(key)}
              className={`text-sm font-medium transition-colors duration-200 ${
                currentPage === key ? 'text-white underline' : 'text-white/80 hover:text-white'
              }`}
            >
              {label}
            </button>
            </div>
          </React.Fragment>
        ))}

        <div className='mr-4'>
          <button
            onClick={() => window.open('https://applygoat.com/contact', '_blank')}
            className="text-sm font-medium transition-colors duration-200 text-white/80 hover:text-white"
          >
            Feedback
          </button>
        </div>


        <div className="ml-6">
          <div
            title={user.name}
            className="w-10 h-10  text-purple-600 rounded-full flex items-center justify-center font-semibold text-lg shadow-md"
          >
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
