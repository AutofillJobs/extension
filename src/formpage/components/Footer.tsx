import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 px-8 py-4 text-center">
      <p className="text-gray-600">
        Enjoy applyGOAT{' '}
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            window.open('https://applygoat.com/contact', '_blank');
          }}
          className="text-blue-500 font-medium hover:underline cursor-pointer"
        >
          Click here to leave a review!
        </a>
      </p>
    </footer>
  );
};

export default Footer; 