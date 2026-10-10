import { z } from 'zod';

// MongoDB ObjectId regex validator (24 hex characters)
export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(objectIdRegex, { message: 'Invalid MongoDB ObjectId format' });

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be a positive integer greater than or equal to 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(
      z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(50, 'Limit cannot exceed 50 items per page')
    ),
  category: z
    .enum(['All', 'Events', 'Lost & Found', 'Study Groups', 'Team Up', 'Questions'])
    .optional(),
  zoneId: z.string().regex(objectIdRegex, 'Invalid zoneId parameter').optional(),
});

export const zoneQuerySchema = z.object({
  type: z.enum(['campus', 'hackathon', 'event', 'transit', 'community']).optional(),
});

export const updateZoneLocationSchema = z.object({
  venueName: z.string().max(200).trim().optional(),
  venueAddress: z.string().max(500).trim().optional(),
  centerLatitude: z.number().min(-90).max(90).optional(),
  centerLongitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().min(50).max(50000).optional(),
  isVirtual: z.boolean().optional(),
  boundaryType: z.enum(['radius', 'unspecified', 'virtual']).optional(),
});

// Need Validators
export const NEED_CATEGORIES_ZOD = [
  'Technical Help',
  'Team Formation',
  'UI/UX Design',
  'Coding & Debugging',
  'Hardware & IoT',
  'Event Questions',
  'Lost & Found',
];

export const createNeedSchema = z.object({
  zoneId: objectIdSchema,
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters long')
    .max(120, 'Title cannot exceed 120 characters')
    .trim(),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters long')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim(),
  category: z.enum(NEED_CATEGORIES_ZOD, {
    errorMap: () => ({ message: 'Invalid need category' }),
  }),
  requiredSkills: z.array(z.string().trim()).default([]),
  estimatedDurationMinutes: z.number().int().min(10).max(720).default(60),
  urgency: z.enum(['low', 'normal', 'urgent']).default('normal'),
  expiryHours: z.number().int().min(1).max(48).default(6),
  visibility: z.enum(['public_event', 'members_only']).default('members_only'),
});

// Offer Validators
export const createOfferSchema = z.object({
  zoneId: objectIdSchema,
  skills: z
    .array(z.string().trim())
    .min(1, 'Must provide at least one skill you can offer to peers'),
  availabilityMinutes: z.number().int().min(15).max(720).default(120),
  preferredCategories: z.array(z.string().trim()).default([]),
  maxConcurrentTasks: z.number().int().min(1).max(3).default(1),
  expiryHours: z.number().int().min(1).max(48).default(8),
});

// AI Draft Extraction Validator
export const extractDraftSchema = z.object({
  text: z
    .string()
    .min(5, 'Spoken or typed request must be at least 5 characters')
    .max(2000, 'Text exceeds 2000 characters')
    .trim(),
});

// Collaboration Validators
export const addNoteSchema = z.object({
  text: z
    .string()
    .min(1, 'Note cannot be empty')
    .max(1000, 'Note cannot exceed 1000 characters')
    .trim(),
});

export const resolveTaskSchema = z.object({
  summaryOutcome: z
    .string()
    .max(500, 'Resolution summary cannot exceed 500 characters')
    .trim()
    .optional(),
});

// Report & Moderation Validators
export const createReportSchema = z.object({
  targetType: z.enum(['post', 'need', 'user', 'collaboration']),
  targetId: objectIdSchema,
  reason: z
    .string()
    .min(5, 'Please provide at least 5 characters explaining the safety concern')
    .max(500, 'Reason cannot exceed 500 characters')
    .trim(),
});

export const moderateReportSchema = z.object({
  status: z.enum(['reviewed', 'dismissed']),
  actionTaken: z.enum(['none', 'flagged_content', 'removed_content', 'deactivated_user']).default('none'),
  moderatorNotes: z.string().max(500).trim().optional(),
});

// Announcement Validator
export const announcementSchema = z.object({
  title: z.string().min(3).max(120).trim(),
  content: z.string().min(5).max(1000).trim(),
});

// Event Join Validator
export const joinEventSchema = z.object({
  joinCode: z.string().trim().optional(),
});
