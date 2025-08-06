import React, { useState } from 'react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: {
    name: string;
    email: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    { label: 'Analytics', key: 'analytics' },
    { label: 'Profile', key: 'profile' },
    { label: 'Settings', key: 'settings' },
  ];

  return (
    <>
      <nav
        className="w-full h-16 px-4 md:px-8 flex justify-between items-center sticky top-0 z-50 py-4"
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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
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
              className="w-10 h-10 bg-white text-purple-600 rounded-full flex items-center justify-center font-semibold text-lg shadow-md"
            >
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          className="md:hidden w-full bg-gradient-to-r from-purple-500 to-teal-400 py-2 px-4 shadow-md"
          style={{
            background: 'linear-gradient(to right, #9333ea, #14b8a6)',
          }}
        >
          <div className="flex flex-col space-y-3">
            {navItems.map(({ label, key }) => (
              <button
                key={key}
                onClick={() => {
                  setCurrentPage(key);
                  setIsMenuOpen(false);
                }}
                className={`text-left py-2 px-3 text-sm font-medium transition-colors duration-200 rounded ${
                  currentPage === key 
                    ? 'text-white bg-white/20' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
            
            <button
              onClick={() => {
                window.open('https://applygoat.com/contact', '_blank');
                setIsMenuOpen(false);
              }}
              className="text-left py-2 px-3 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded hover:bg-white/10"
            >
              Feedback
            </button>

            <div className="flex items-center py-2 px-3">
              <div
                title={user.name}
                className="w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm shadow-md mr-3"
              >
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="text-white text-sm">{user.name || 'User'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;