import React from 'react';
import {
  MapPin,
  Users,
  Radio,
  Compass,
  Navigation,
  ExternalLink,
  Calendar,
  Globe,
  Clock,
  Info,
} from 'lucide-react';
import type { Zone } from '../../types';
import { Button } from '../common/Button';
import { useZone } from '../../context/ZoneContext';
import {
  getZoneLifecycleStatus,
  getZoneRelevanceExplanation,
  getZoneBoundaryDescription,
  getDirectionsUrl,
} from '../../utils/zoneUtils';

interface ZoneCardProps {
  zone: Zone;
  isSelected?: boolean;
  onSelectZone?: (zone: Zone) => void;
  className?: string;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({
  zone,
  isSelected = false,
  onSelectZone,
  className = '',
}) => {
  const {
    locationState,
    calculateDistanceToZone,
    requestUserLocation,
    isLocationLoading,
  } = useZone();

  const lifecycle = getZoneLifecycleStatus(zone);
  const boundaryDesc = getZoneBoundaryDescription(zone);
  const relevance = getZoneRelevanceExplanation(zone);
  const directionsUrl = getDirectionsUrl(zone);
  const distanceResult = calculateDistanceToZone(zone);

  const isVirtual = zone.isVirtual || zone.boundaryType === 'virtual';

  const typeConfig: Record<string, { label: string; badgeClass: string }> = {
    campus: {
      label: 'Campus Quad',
      badgeClass: 'bg-plum-100 text-plum-900 border-plum-200',
    },
    hackathon: {
      label: 'Hackathon Arena',
      badgeClass: 'bg-rose-300/40 text-plum-900 border-rose-300 font-bold',
    },
    event: {
      label: 'Public Event',
      badgeClass: 'bg-semantic-success-bg text-semantic-success border-semantic-success-border',
    },
    transit: {
      label: 'Transit Hub',
      badgeClass: 'bg-semantic-warning-bg text-semantic-warning border-semantic-warning-border',
    },
    community: {
      label: 'Local Community',
      badgeClass: 'bg-rose-100 text-rose-700 border-rose-300',
    },
  };

  const currentType = typeConfig[zone.type] || typeConfig.community;

  return (
    <div
      className={`glass-card relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 transition-all duration-300 border bg-white ${
        isSelected
          ? 'border-2 border-rose-500 shadow-rose-glow-sm'
          : 'border-plum-200 hover:border-rose-400 shadow-plum-sm'
      } ${className}`}
    >
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${currentType.badgeClass}`}
            >
              {currentType.label}
            </span>

            {isVirtual ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/70 text-plum-900 border border-rose-300 flex items-center gap-1">
                <Globe className="w-3 h-3 text-rose-500" />
                <span>Online Zone</span>
              </span>
            ) : (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${lifecycle.badgeClass}`}
              >
                {lifecycle.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-plum-800 bg-plum-100/80 px-2.5 py-0.5 rounded-full border border-plum-200">
            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
            <span className="font-mono text-[10px]">{boundaryDesc}</span>
          </div>
        </div>

        {/* Zone Name */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-plum-900 brand-font hover:text-rose-600 transition-colors">
            {zone.name}
          </h3>
          <p className="text-xs text-plum-600 mt-1 leading-relaxed line-clamp-2">
            {zone.description}
          </p>
        </div>

        {/* Real Location Section */}
        <div className="p-3.5 rounded-2xl bg-plum-100/60 border border-plum-200 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold text-plum-900 truncate">
                {zone.venueName || (isVirtual ? 'Virtual Room' : 'Designated Event Venue')}
              </p>
              <p className="text-[11px] text-plum-600 leading-normal">
                {zone.venueAddress || (isVirtual ? 'Distributed Online Space' : 'Venue address not specified')}
              </p>
            </div>
          </div>

          {/* Dates if available */}
          {(zone.startDate || zone.endDate) && (
            <div className="flex items-center gap-2 pt-1 border-t border-plum-200 text-[11px] text-plum-600">
              <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                {zone.startDate ? new Date(zone.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active'}
                {zone.endDate ? ` – ${new Date(zone.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </div>
          )}

          {/* Real Distance Output */}
          <div className="pt-1 border-t border-plum-200 flex items-center justify-between text-[11px]">
            <span className="text-plum-600">Your distance:</span>
            {isVirtual ? (
              <span className="text-rose-600 font-mono font-medium">Virtual (N/A)</span>
            ) : distanceResult ? (
              <span
                className={`font-mono font-bold ${
                  distanceResult.isWithinRadius ? 'text-semantic-success' : 'text-plum-900'
                }`}
              >
                {distanceResult.formattedText}
              </span>
            ) : locationState === 'permission_denied' ? (
              <span className="text-semantic-warning font-semibold">Permission denied</span>
            ) : (
              <button
                type="button"
                onClick={() => requestUserLocation()}
                disabled={isLocationLoading}
                className="text-rose-600 hover:text-rose-700 underline font-medium"
              >
                {isLocationLoading ? 'Calculating...' : 'Enable location to calculate'}
              </button>
            )}
          </div>
        </div>

        {/* Relevance Explanation */}
        <div className="flex items-start gap-1.5 text-[11px] text-plum-600 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <span>{relevance}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-plum-200 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant={isSelected ? 'primary' : 'outline'}
            size="sm"
            className="flex-1 shadow-sm"
            onClick={() => onSelectZone && onSelectZone(zone)}
            leftIcon={<Compass className="w-3.5 h-3.5" />}
          >
            {isSelected ? 'Active Zone' : 'Select Zone'}
          </Button>

          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-plum-200 text-plum-700 hover:text-plum-900 hover:border-rose-400 transition-colors shadow-plum-sm"
              title="Get directions on map"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-500" />
              <span>Map</span>
            </a>
          )}
        </div>

        {isSelected && (
          <p className="text-[10px] text-rose-600 text-center font-mono font-medium">
            ● Focused context active across Need-to-Action network
          </p>
        )}
      </div>
    </div>
  );
};

export default ZoneCard;
