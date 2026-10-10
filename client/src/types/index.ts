export type ZoneType = 'campus' | 'hackathon' | 'event' | 'transit' | 'community';

export type PostCategory = 'All' | 'Events' | 'Lost & Found' | 'Study Groups' | 'Team Up' | 'Questions';

export type NeedCategory =
  | 'Technical Help'
  | 'Team Formation'
  | 'UI/UX Design'
  | 'Coding & Debugging'
  | 'Hardware & IoT'
  | 'Event Questions'
  | 'Lost & Found';

export type NeedStatus = 'OPEN' | 'MATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'EXPIRED';

export interface EventAnnouncement {
  _id?: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface Zone {
  _id: string;
  id?: string;
  name: string;
  description: string;
  type: ZoneType;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  radius?: number;
  location?: {
    type?: string;
    coordinates: [number, number];
  };
  venueName?: string;
  venueAddress?: string;
  isVirtual?: boolean;
  boundaryType?: 'radius' | 'unspecified' | 'virtual';
  startDate?: string;
  endDate?: string;
  joinCode?: string;
  isPublic?: boolean;
  announcements?: EventAnnouncement[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  activePostsCount?: number;
  tags?: string[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer' | 'moderator';
  bio: string;
  skills?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Need {
  _id: string;
  requesterId: string | User;
  zoneId: string | Zone;
  title: string;
  description: string;
  category: NeedCategory;
  requiredSkills: string[];
  estimatedDurationMinutes: number;
  urgency: 'low' | 'normal' | 'urgent';
  expiresAt: string;
  visibility: 'public_event' | 'members_only';
  status: NeedStatus;
  acceptedHelperId?: string | User | null;
  activeCollaborationId?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Offer {
  _id: string;
  helperId: string | User;
  zoneId: string | Zone;
  skills: string[];
  availabilityMinutes: number;
  preferredCategories: string[];
  maxConcurrentTasks: number;
  activeTaskCount: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchScoreBreakdown {
  skills: number;
  availability: number;
  category: number;
  workload: number;
}

export interface MatchCandidate {
  offerId: string;
  helper: {
    _id: string;
    name: string;
    bio?: string;
    role: string;
  };
  score: number;
  scoreBreakdown: MatchScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  availabilityConflict: boolean;
  availableMinutes: number;
  reasons: string[];
  eligibilityStatus: string;
}

export interface CollaborationNote {
  _id: string;
  senderId: string | User;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Collaboration {
  _id: string;
  needId: string | Need;
  offerId?: string | Offer;
  requesterId: User;
  helperId: User;
  zoneId: Zone;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED' | 'EXPIRED';
  deadline: string;
  notes: CollaborationNote[];
  completedAt?: string | null;
  summaryOutcome?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EventAnalytics {
  zoneName: string;
  zoneType: string;
  totalNeeds: number;
  openNeeds: number;
  activeCollaborations: number;
  resolvedNeeds: number;
  expiredNeeds: number;
  activeOffers: number;
  totalReports: number;
  matchAcceptanceRate: number;
  taskResolutionRate: number;
  medianResolutionMinutes: number;
  medianTimeToMatchMinutes: number;
}

export interface Report {
  _id: string;
  reporterId: User;
  targetType: 'post' | 'need' | 'collaboration' | 'user' | 'zone';
  targetId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface PostZone {
  _id: string;
  name: string;
  type: ZoneType;
  radiusMeters?: number;
}

export interface Post {
  _id: string;
  authorId: string | { _id: string; name: string; role: 'user' | 'moderator' | 'organizer'; bio?: string };
  zoneId: string | Zone | PostZone;
  title: string;
  content: string;
  category: PostCategory;
  expiresAt: string;
  moderationStatus: 'pending' | 'approved' | 'flagged' | 'removed';
  createdAt: string;
  updatedAt?: string;
  upvotes?: number;
  repliesCount?: number;
  isMock?: boolean;
}

export interface HealthCheckResponse {
  status: 'ok' | 'unhealthy';
  service: string;
  database: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | string;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  count?: number;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
