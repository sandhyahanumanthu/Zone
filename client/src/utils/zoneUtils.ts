import type { Zone } from '../types';
import { formatRadius } from './dateUtils';

export interface ZoneLifecycleStatusInfo {
  status: 'Upcoming' | 'Active' | 'Ended' | 'Unavailable';
  label: string;
  badgeClass: string;
}

/**
 * Derives accurate zone status from active timestamps and database state.
 */
export function getZoneLifecycleStatus(zone: Zone): ZoneLifecycleStatusInfo {
  if (!zone || zone.isActive === false) {
    return {
      status: 'Unavailable',
      label: 'Unavailable',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    };
  }

  const now = new Date();

  if (zone.startDate && new Date(zone.startDate) > now) {
    return {
      status: 'Upcoming',
      label: 'Upcoming',
      badgeClass: 'bg-plum-100 text-plum-800 border-plum-200',
    };
  }

  if (zone.endDate && new Date(zone.endDate) < now) {
    return {
      status: 'Ended',
      label: 'Ended',
      badgeClass: 'bg-plum-50 text-plum-500 border-plum-200',
    };
  }

  return {
    status: 'Active',
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };
}

/**
 * Returns a clear explanation of what makes this zone relevant to the user.
 */
export function getZoneRelevanceExplanation(zone: Zone): string {
  if (zone.isVirtual || zone.boundaryType === 'virtual') {
    return 'Online Zone: Connect, broadcast needs, and exchange technical assistance remotely from any location with zero geographic restriction.';
  }

  switch (zone.type) {
    case 'hackathon':
      return 'Designated hackathon builder bays with live peer skill matching, active mentors, and project milestone collaboration.';
    case 'campus':
      return 'Campus quad perimeter for verified student collaboration, real-time study hubs, and academic peer debugging.';
    case 'event':
      return 'Official event venue perimeter for attendees to exchange assistance, coordinate meetups, and report lost items.';
    case 'transit':
      return 'Transit exchange and commute zone for quick localized inquiries, lost-and-found items, and transit updates.';
    case 'community':
    default:
      return 'Localized micro-community for nearby skill sharing, verified peer assistance, and fast problem-solving.';
  }
}

/**
 * Returns readable boundary information without inventing numbers.
 */
export function getZoneBoundaryDescription(zone: Zone): string {
  if (zone.isVirtual || zone.boundaryType === 'virtual') {
    return 'Online Zone (No physical geographic boundary)';
  }

  if (zone.boundaryType === 'unspecified') {
    return 'Designated venue area (Boundary unspecified)';
  }

  const radius = zone.radiusMeters || zone.radius;
  if (radius && radius > 0) {
    return `${formatRadius(radius)} radius around designated venue`;
  }

  return 'Venue location specified (Perimeter boundary unspecified)';
}

/**
 * Haversine formula for client-side geodesic distance computation in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface DistanceCalculationResult {
  distanceMeters: number;
  distanceKm: number;
  formattedText: string;
  isWithinRadius: boolean;
}

/**
 * Formats geodesic distance into human-readable text.
 * Never invents distances or claims arrival without calculation.
 */
export function formatDistanceResult(
  distanceMeters: number,
  radiusMeters?: number
): DistanceCalculationResult {
  const distanceKm = distanceMeters / 1000;
  const isWithinRadius = !!(radiusMeters && radiusMeters > 0 && distanceMeters <= radiusMeters);

  let formattedText = '';
  if (isWithinRadius) {
    formattedText = `Inside designated coverage area (~${Math.round(distanceMeters)}m from venue center)`;
  } else if (distanceKm < 1) {
    formattedText = `Approximately ${Math.round(distanceMeters)} m away`;
  } else {
    formattedText = `Approximately ${distanceKm.toFixed(1)} km away`;
  }

  return {
    distanceMeters,
    distanceKm,
    formattedText,
    isWithinRadius,
  };
}

/**
 * Generates an external maps directions link for actual coordinates or venue address.
 */
export function getDirectionsUrl(zone: Zone): string | null {
  if (zone.isVirtual || zone.boundaryType === 'virtual') {
    return null;
  }

  const lat = zone.centerLatitude ?? zone.location?.coordinates?.[1];
  const lng = zone.centerLongitude ?? zone.location?.coordinates?.[0];

  if (typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  if (zone.venueAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.venueAddress)}`;
  }

  if (zone.venueName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.venueName)}`;
  }

  return null;
}
