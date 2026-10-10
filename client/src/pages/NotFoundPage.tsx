import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, MapPinOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="bg-white rounded-3xl p-10 max-w-lg w-full flex flex-col items-center relative overflow-hidden border border-plum-200 shadow-plum-xl">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-plum-100 border border-plum-200 flex items-center justify-center text-plum-900 shadow-plum-sm">
            <MapPinOff className="w-12 h-12 text-rose-500" />
          </div>
          <span className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm">
            404
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-plum-900 mb-3 brand-font">
          Zone Perimeter Not Found
        </h1>

        <p className="text-sm text-plum-600 max-w-md mb-8 leading-relaxed">
          The coordinates or route you requested are outside known DropZone boundaries or have
          expired from the cluster.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />} className="w-full">
              Back to Home
            </Button>
          </Link>
          <Link to="/zones" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" leftIcon={<Compass className="w-4 h-4" />} className="w-full">
              Explore Active Zones
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
