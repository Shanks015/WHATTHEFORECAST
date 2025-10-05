import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-background-dark border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:order-2">
            <a className="text-sm text-gray-400 hover:text-white" href="#">Privacy Policy</a>
            <a className="text-sm text-gray-400 hover:text-white" href="#">Terms of Service</a>
            <a className="text-sm text-gray-400 hover:text-white" href="#">Contact Us</a>
          </div>
          <p className="text-sm text-gray-400 md:order-1">© 2024 EarthView. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;