import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-3">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center text-sm text-gray-500">
          © {currentYear} SpokenEdge • v1.0.0
        </div>
      </div>
    </footer>
  );
};

export default Footer;