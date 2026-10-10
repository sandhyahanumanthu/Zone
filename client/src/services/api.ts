import axios from 'axios';
import type {
  ApiResponse,
  HealthCheckResponse,
  Zone,
  Post,
  User,
  Need,
  Offer,
  MatchCandidate,
  Collaboration,
  CollaborationNote,
  Report,
  EventAnalytics,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// In-memory / session token storage for fallback Authorization Bearer header
let inMemoryToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('dropzone_token') : null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('dropzone_token', token);
    } else {
      sessionStorage.removeItem('dropzone_token');
    }
  }
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Send and receive HttpOnly cookies across origins
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization Bearer token if present
apiClient.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// Centralized Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out'
        : error.message || 'Network error: Backend server unreachable');
    return Promise.reject(new Error(message));
  }
);

/* ==========================================================================
   AUTHENTICATION SERVICE
   ========================================================================== */
export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token?: string;
}

export const authService = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    bio?: string;
    skills?: string[];
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/logout');
    setAuthToken(null);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return response.data.user;
  },

  updateProfile: async (data: { name?: string; bio?: string; skills?: string[] }): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; message: string; user: User }>(
      '/auth/me',
      data
    );
    return response.data.user;
  },
};

/* ==========================================================================
   HEALTH SERVICE
   ========================================================================== */
export const healthService = {
  checkHealth: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    return response.data;
  },
};

/* ==========================================================================
   ZONE / EVENT SERVICE
   ========================================================================== */
export const zoneService = {
  getAllZones: async (type?: string): Promise<Zone[]> => {
    const params = type && type !== 'all' ? { type } : {};
    const response = await apiClient.get<ApiResponse<Zone[]>>('/zones', { params });
    return response.data.data;
  },

  getZoneById: async (id: string): Promise<Zone> => {
    const response = await apiClient.get<ApiResponse<Zone>>(`/zones/${id}`);
    return response.data.data;
  },

  joinZone: async (id: string, joinCode?: string): Promise<void> => {
    await apiClient.post(`/zones/${id}/join`, { joinCode });
  },

  addAnnouncement: async (id: string, data: { title: string; content: string }): Promise<void> => {
    await apiClient.post(`/zones/${id}/announcements`, data);
  },

  updateZoneLocation: async (id: string, data: Partial<Zone>): Promise<Zone> => {
    const response = await apiClient.patch<ApiResponse<Zone>>(`/zones/${id}/location`, data);
    return response.data.data;
  },
};

/* ==========================================================================
   NEED / REQUEST SERVICE (Need-to-Action Core)
   ========================================================================== */
export const needService = {
  createNeed: async (data: {
    zoneId: string;
    title: string;
    description: string;
    category: string;
    requiredSkills: string[];
    estimatedDurationMinutes: number;
    urgency?: 'low' | 'normal' | 'urgent';
    expiryHours?: number;
    visibility?: 'public_event' | 'members_only';
  }): Promise<Need> => {
    const response = await apiClient.post<ApiResponse<Need>>('/needs', data);
    return response.data.data;
  },

  getNeeds: async (params?: {
    zoneId?: string;
    category?: string;
    status?: string;
    myNeedsOnly?: boolean;
    includeResolved?: boolean;
  }): Promise<Need[]> => {
    const response = await apiClient.get<ApiResponse<Need[]>>('/needs', { params });
    return response.data.data;
  },

  getNeedById: async (id: string): Promise<Need> => {
    const response = await apiClient.get<ApiResponse<Need>>(`/needs/${id}`);
    return response.data.data;
  },

  extractDraft: async (text: string): Promise<{
    suggestedTitle: string;
    category: string;
    requiredSkills: string[];
    estimatedDurationMinutes: number;
    urgency: 'low' | 'normal' | 'urgent';
    expiryHours: number;
    cleanDescription: string;
    confidence: number;
  }> => {
    const response = await apiClient.post<ApiResponse<any>>('/needs/extract-draft', { text });
    return response.data.data;
  },

  cancelNeed: async (id: string): Promise<Need> => {
    const response = await apiClient.patch<ApiResponse<Need>>(`/needs/${id}/cancel`);
    return response.data.data;
  },

  resolveNeed: async (id: string, resolutionNotes?: string): Promise<Need> => {
    const response = await apiClient.patch<ApiResponse<Need>>(`/needs/${id}/resolve`, { resolutionNotes });
    return response.data.data;
  },
};

/* ==========================================================================
   OFFER SERVICE (Helper Skills & Availability)
   ========================================================================== */
export const offerService = {
  createOrUpdateOffer: async (data: {
    zoneId: string;
    skills: string[];
    availabilityMinutes: number;
    preferredCategories?: string[];
    maxConcurrentTasks?: number;
    expiryHours?: number;
  }): Promise<Offer> => {
    const response = await apiClient.post<ApiResponse<Offer>>('/offers', data);
    return response.data.data;
  },

  getOffers: async (zoneId?: string, includeAll?: boolean): Promise<Offer[]> => {
    const params: any = {};
    if (zoneId) params.zoneId = zoneId;
    if (includeAll) params.includeAll = 'true';
    const response = await apiClient.get<ApiResponse<Offer[]>>('/offers', { params });
    return response.data.data;
  },

  getMyOffer: async (zoneId?: string): Promise<Offer | null> => {
    const response = await apiClient.get<ApiResponse<Offer>>('/offers/my', { params: { zoneId } });
    return response.data.data;
  },

  toggleOffer: async (id: string): Promise<Offer> => {
    const response = await apiClient.patch<ApiResponse<Offer>>(`/offers/${id}/toggle`);
    return response.data.data;
  },
};

/* ==========================================================================
   MATCHING SERVICE (Explainable Multi-Factor Engine)
   ========================================================================== */
export const matchService = {
  getMatchesForNeed: async (needId: string): Promise<MatchCandidate[]> => {
    const response = await apiClient.get<ApiResponse<MatchCandidate[]>>(`/matches/needs/${needId}`);
    return response.data.data;
  },

  acceptMatch: async (
    needId: string,
    offerId: string
  ): Promise<{ collaborationId: string; need: Need; collaboration: Collaboration }> => {
    const response = await apiClient.post<ApiResponse<any>>(`/matches/needs/${needId}/accept`, {
      offerId,
    });
    return response.data.data;
  },
};

/* ==========================================================================
   COLLABORATION SERVICE (Workspace Room)
   ========================================================================== */
export const collaborationService = {
  getCollaboration: async (id: string): Promise<Collaboration> => {
    const response = await apiClient.get<ApiResponse<Collaboration>>(`/collaborations/${id}`);
    return response.data.data;
  },

  addNote: async (id: string, text: string): Promise<CollaborationNote> => {
    const response = await apiClient.post<ApiResponse<CollaborationNote>>(
      `/collaborations/${id}/notes`,
      { text }
    );
    return response.data.data;
  },

  resolveCollaboration: async (id: string, summaryOutcome?: string): Promise<Collaboration> => {
    const response = await apiClient.patch<ApiResponse<Collaboration>>(
      `/collaborations/${id}/resolve`,
      { summaryOutcome }
    );
    return response.data.data;
  },

  leaveCollaboration: async (id: string): Promise<Collaboration> => {
    const response = await apiClient.patch<ApiResponse<Collaboration>>(
      `/collaborations/${id}/leave`
    );
    return response.data.data;
  },
};

/* ==========================================================================
   MODERATION & SAFETY SERVICE
   ========================================================================== */
export const moderationService = {
  createReport: async (data: {
    targetType: 'post' | 'need' | 'collaboration' | 'user' | 'zone';
    targetId: string;
    reason: string;
  }): Promise<Report> => {
    const response = await apiClient.post<ApiResponse<Report>>('/moderation/reports', data);
    return response.data.data;
  },

  getModerationQueue: async (status?: string): Promise<Report[]> => {
    const response = await apiClient.get<ApiResponse<Report[]>>('/moderation/queue', {
      params: { status },
    });
    return response.data.data;
  },

  moderateReport: async (
    id: string,
    data: {
      status: 'reviewed' | 'dismissed';
      actionTaken?: 'none' | 'flagged_content' | 'removed_content' | 'deactivated_user';
      moderatorNotes?: string;
    }
  ): Promise<any> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/moderation/reports/${id}`, data);
    return response.data.data;
  },

  blockUser: async (targetUserId: string): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>('/moderation/block', { targetUserId });
    return response.data.data;
  },

  getBlockedUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/moderation/blocked');
    return response.data.data;
  },
};

/* ==========================================================================
   ANALYTICS SERVICE
   ========================================================================== */
export const analyticsService = {
  getEventAnalytics: async (zoneId: string): Promise<EventAnalytics> => {
    const response = await apiClient.get<ApiResponse<EventAnalytics>>(`/analytics/events/${zoneId}`);
    return response.data.data;
  },
};

/* ==========================================================================
   LEGACY POST SERVICE (Preserved for backwards compatibility)
   ========================================================================== */
export const postService = {
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    zoneId?: string;
  }): Promise<{ posts: Post[]; pagination: ApiResponse<Post[]>['pagination'] }> => {
    const response = await apiClient.get<ApiResponse<Post[]>>('/posts', { params });
    return {
      posts: response.data.data,
      pagination: response.data.pagination,
    };
  },
};

export default apiClient;
