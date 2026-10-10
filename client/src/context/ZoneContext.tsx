import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { zoneService } from '../services/api';
import { MOCK_ZONES } from '../data/mockData';
import type { Zone } from '../types';
import {
  calculateHaversineDistance,
  formatDistanceResult,
  type DistanceCalculationResult,
} from '../utils/zoneUtils';

export type ZoneStatus = 'idle' | 'locating' | 'active' | 'permission_denied' | 'error';
export type ZoneTypeMode = 'hackathon' | 'campus' | 'transit' | 'community' | 'event' | 'neutral';

export type LocationControlState =
  | 'not_requested'
  | 'permission_required'
  | 'permission_granted'
  | 'permission_denied'
  | 'unavailable'
  | 'error'
  | 'disabled';

export type LocationPreference = 'enabled' | 'disabled';

interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

interface ZoneContextType {
  currentZone: Zone | null;
  setCurrentZone: (zone: Zone | null) => void;
  zones: Zone[];
  zoneStatus: ZoneStatus;
  setZoneStatus: (status: ZoneStatus) => void;
  zoneTypeMode: ZoneTypeMode;
  isLoadingZones: boolean;
  selectZoneById: (zoneId: string) => void;

  // Dedicated Location State Management
  locationState: LocationControlState;
  locationPreference: LocationPreference;
  userCoords: UserCoordinates | null;
  isLocationLoading: boolean;
  locationErrorMessage: string | null;
  locationInstructions: string | null;

  requestUserLocation: () => Promise<boolean>;
  stopUsingLocation: () => void;
  toggleLocationPreference: (enabled: boolean) => void;
  calculateDistanceToZone: (zone: Zone) => DistanceCalculationResult | null;

  // Backwards compatibility
  hasLocationPermission: boolean | null;
  requestLocationVerification: () => Promise<void>;
}

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

const SESSION_ZONE_KEY = 'dropzone_active_zone_id';
const LOCATION_PREF_KEY = 'dropzone_user_location_preference';

export const ZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [currentZone, setCurrentZoneState] = useState<Zone | null>(null);
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>('active');
  const [isLoadingZones, setIsLoadingZones] = useState(false);

  // Separate website's own location preference from browser permission state
  const [locationPreference, setLocationPreference] = useState<LocationPreference>(() => {
    const saved = localStorage.getItem(LOCATION_PREF_KEY);
    return saved === 'disabled' ? 'disabled' : 'enabled';
  });

  const [locationState, setLocationState] = useState<LocationControlState>(() => {
    const saved = localStorage.getItem(LOCATION_PREF_KEY);
    return saved === 'disabled' ? 'disabled' : 'not_requested';
  });

  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [locationInstructions, setLocationInstructions] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Load all zones on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingZones(true);

    zoneService
      .getAllZones()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setZones(data);
          const savedZoneId = sessionStorage.getItem(SESSION_ZONE_KEY);
          const matched = savedZoneId
            ? data.find((z) => z.id === savedZoneId || (z as any)._id === savedZoneId)
            : null;
          const initialZone =
            matched || data.find((z) => z.type === 'hackathon') || data[0];
          setCurrentZoneState(initialZone);
        } else {
          setCurrentZoneState(MOCK_ZONES[0]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setZones(MOCK_ZONES);
        setCurrentZoneState(MOCK_ZONES[0]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingZones(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Inspect browser permission state without prompting
  useEffect(() => {
    if (locationPreference === 'disabled') {
      setLocationState('disabled');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setLocationState('permission_denied');
            setLocationInstructions(
              'Location permission is blocked in your browser. Click the lock/site settings icon in your browser address bar to allow location.'
            );
          } else if (permissionStatus.state === 'prompt') {
            if (locationState === 'not_requested' || locationState === 'disabled') {
              setLocationState('not_requested');
            }
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'denied') {
              setLocationState('permission_denied');
              setUserCoords(null);
            } else if (permissionStatus.state === 'granted') {
              if (locationPreference === 'enabled') {
                setLocationState('permission_granted');
              }
            } else {
              setLocationState('permission_required');
            }
          };
        })
        .catch(() => {
          // Permissions API unsupported; remain in current state
        });
    }
  }, [locationPreference]);

  const setCurrentZone = useCallback((zone: Zone | null) => {
    setCurrentZoneState(zone);
    if (zone) {
      sessionStorage.setItem(SESSION_ZONE_KEY, zone.id || (zone as any)._id || '');
      setZoneStatus('active');
    } else {
      sessionStorage.removeItem(SESSION_ZONE_KEY);
      setZoneStatus('idle');
    }
  }, []);

  const selectZoneById = useCallback(
    (zoneId: string) => {
      const found = zones.find((z) => z.id === zoneId || (z as any)._id === zoneId);
      if (found) {
        setCurrentZone(found);
      }
    },
    [zones, setCurrentZone]
  );

  // Request browser location on explicit user action (Never on page load)
  const requestUserLocation = useCallback(async (): Promise<boolean> => {
    if (locationPreference === 'disabled') {
      // Re-enable preference upon explicit user request
      setLocationPreference('enabled');
      localStorage.setItem(LOCATION_PREF_KEY, 'enabled');
    }

    if (!navigator.geolocation) {
      setLocationState('error');
      setLocationErrorMessage('Geolocation is not supported by your browser.');
      setIsLocationLoading(false);
      return false;
    }

    setIsLocationLoading(true);
    setLocationErrorMessage(null);
    setLocationInstructions(null);
    setZoneStatus('locating');

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: UserCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
          };

          setUserCoords(coords);
          setLocationState('permission_granted');
          setZoneStatus('active');
          setIsLocationLoading(false);
          resolve(true);
        },
        (error) => {
          setIsLocationLoading(false);
          setUserCoords(null);

          if (error.code === error.PERMISSION_DENIED) {
            setLocationState('permission_denied');
            setZoneStatus('permission_denied');
            setLocationErrorMessage('Browser location permission was declined.');
            setLocationInstructions(
              'To enable proximity calculations, click the padlock/settings icon in your browser address bar, set Location to "Allow", and try again.'
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationState('unavailable');
            setZoneStatus('error');
            setLocationErrorMessage('Location information is currently unavailable.');
          } else if (error.code === error.TIMEOUT) {
            setLocationState('unavailable');
            setZoneStatus('error');
            setLocationErrorMessage('Location request timed out. Please try again.');
          } else {
            setLocationState('error');
            setZoneStatus('error');
            setLocationErrorMessage('An unexpected error occurred while retrieving location.');
          }
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [locationPreference]);

  // Stop Using Location: Clears memory coordinates and stops any active watch
  const stopUsingLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clear coordinates from application memory
    setUserCoords(null);
    setLocationPreference('disabled');
    localStorage.setItem(LOCATION_PREF_KEY, 'disabled');
    setLocationState('disabled');
    setLocationErrorMessage(null);
    setLocationInstructions(null);
    setZoneStatus('active');
  }, []);

  // Toggle application-level location preference
  const toggleLocationPreference = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        setLocationPreference('enabled');
        localStorage.setItem(LOCATION_PREF_KEY, 'enabled');
        setLocationState('not_requested');
        setLocationErrorMessage(null);
      } else {
        stopUsingLocation();
      }
    },
    [stopUsingLocation]
  );

  // Honest geodesic distance calculator: Never invents coordinates
  const calculateDistanceToZone = useCallback(
    (zone: Zone): DistanceCalculationResult | null => {
      // Return null if location access has not been granted or preference is disabled
      if (locationState !== 'permission_granted' || !userCoords) {
        return null;
      }

      // Online zones do not have a physical distance
      if (zone.isVirtual || zone.boundaryType === 'virtual') {
        return null;
      }

      const zoneLat = zone.centerLatitude ?? zone.location?.coordinates?.[1];
      const zoneLng = zone.centerLongitude ?? zone.location?.coordinates?.[0];

      // Missing coordinates check
      if (
        typeof zoneLat !== 'number' ||
        typeof zoneLng !== 'number' ||
        (zoneLat === 0 && zoneLng === 0)
      ) {
        return null;
      }

      const distanceMeters = calculateHaversineDistance(
        userCoords.latitude,
        userCoords.longitude,
        zoneLat,
        zoneLng
      );

      const radius = zone.radiusMeters || zone.radius || 0;
      return formatDistanceResult(distanceMeters, radius);
    },
    [locationState, userCoords]
  );

  // Backward-compatible requestLocationVerification wrapper
  const requestLocationVerification = useCallback(async () => {
    await requestUserLocation();
  }, [requestUserLocation]);

  const zoneTypeMode: ZoneTypeMode = currentZone?.type
    ? (currentZone.type as ZoneTypeMode)
    : 'neutral';

  const hasLocationPermission = locationState === 'permission_granted';

  return (
    <ZoneContext.Provider
      value={{
        currentZone,
        setCurrentZone,
        zones,
        zoneStatus,
        setZoneStatus,
        zoneTypeMode,
        isLoadingZones,
        selectZoneById,

        locationState,
        locationPreference,
        userCoords,
        isLocationLoading,
        locationErrorMessage,
        locationInstructions,

        requestUserLocation,
        stopUsingLocation,
        toggleLocationPreference,
        calculateDistanceToZone,

        hasLocationPermission,
        requestLocationVerification,
      }}
    >
      {children}
    </ZoneContext.Provider>
  );
};

export const useZone = (): ZoneContextType => {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within a ZoneProvider');
  }
  return context;
};

export default ZoneContext;
