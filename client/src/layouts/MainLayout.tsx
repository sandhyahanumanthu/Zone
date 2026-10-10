import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { AuroraBackground } from '../components/common/AuroraBackground';

export const MainLayout: React.FC = () => {
  return (
    <AuroraBackground className="flex flex-col selection:bg-rose-500 selection:text-white">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </AuroraBackground>
  );
};

export default MainLayout;
