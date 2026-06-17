import React from 'react';
import PublicHeader from './PublicHeader';
import Footer from './Footer';

const Layout = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className={`flex-grow ${fullWidth ? 'w-full' : 'container mx-auto px-4 py-8'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;