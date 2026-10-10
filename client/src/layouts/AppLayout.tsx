import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { Sidebar } from '../components/navigation/Sidebar';
import { AuroraBackground } from '../components/common/AuroraBackground';
import { healthService } from '../services/api';
import { useZone } from '../context/ZoneContext';
import type { HealthCheckResponse } from '../types';

export const AppLayout: React.FC = () => {
  const { currentZone } = useZone();
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    healthService
      .checkHealth()
      .then((data) => {
        if (mounted) setHealth(data);
      })
      .catch(() => {
        if (mounted) {
          setHealth({
            status: 'unhealthy',
            service: 'DropZone API',
            database: 'disconnected',
            message: 'Server offline or standby',
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuroraBackground className="flex flex-col selection:bg-rose-500 selection:text-white">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block sticky top-28">
            <Sidebar currentZone={currentZone} health={health} />
          </div>

          {/* Main App Content View */}
          <main className="flex-1 w-full min-w-0">
            <Outlet context={{ currentZone, health }} />
          </main>
        </div>
      </div>
      <Footer />
    </AuroraBackground>
  );
};

export default AppLayout;
