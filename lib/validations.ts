import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

/**
 * Valid latitude range
 */
export const latitudeSchema = z.number().min(-90).max(90);

/**
 * Valid longitude range
 */
export const longitudeSchema = z.number().min(-180).max(180);

/**
 * Valid coordinates object
 */
export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

/**
 * Optional coordinates (can be null)
 */
export const optionalCoordinatesSchema = z.object({
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
});

/**
 * Safe string with max length
 */
export const safeString = (maxLength: number) =>
  z.string().max(maxLength).trim();

/**
 * Safe optional string
 */
export const optionalSafeString = (maxLength: number) =>
  safeString(maxLength).optional().nullable();

// ============================================
// Catch Validation
// ============================================

export const createCatchSchema = z.object({
  // Location
  latitude: z.union([z.number(), z.string().transform(Number)])
    .pipe(latitudeSchema)
    .nullable()
    .optional(),
  longitude: z.union([z.number(), z.string().transform(Number)])
    .pipe(longitudeSchema)
    .nullable()
    .optional(),
  location: safeString(500).nullable().optional(),
  locationPrivate: z.boolean().optional().default(false),

  // Fish data
  species: safeString(200).nullable().optional(),
  scientificName: safeString(200).nullable().optional(),
  weight: z.union([z.number(), z.string().transform(Number)])
    .pipe(z.number().positive().max(10000)) // Max 10,000 kg
    .nullable()
    .optional(),
  length: z.union([z.number(), z.string().transform(Number)])
    .pipe(z.number().positive().max(2000)) // Max 20 meters in cm
    .nullable()
    .optional(),

  // Conditions
  depth: z.union([z.number(), z.string().transform(Number)])
    .pipe(z.number().min(0).max(11000)) // Max Mariana Trench depth
    .nullable()
    .optional(),
  waterTemp: z.union([z.number(), z.string().transform(Number)])
    .pipe(z.number().min(-5).max(50)) // Realistic water temps
    .nullable()
    .optional(),
  bait: safeString(200).nullable().optional(),
  method: safeString(200).nullable().optional(),
  rating: z.union([z.number(), z.string().transform(Number)])
    .pipe(z.number().int().min(1).max(5))
    .nullable()
    .optional(),

  // Content
  description: safeString(5000).nullable().optional(),
  imageUrl: safeString(2000).nullable().optional(),
  isPublic: z.boolean().optional().default(true),
  isTextOnly: z.boolean().optional().default(false),
  postType: z.enum(['catch', 'text', 'bait_mix']).nullable().optional(),

  // Weather data (JSON)
  weatherData: z.record(z.string(), z.unknown()).nullable().optional(),

  // Bait mix data (for postType = "bait_mix")
  baitMixData: z.object({
    mixName: safeString(200),
    ingredients: z.array(z.object({
      name: safeString(100),
      amount: safeString(50),
      unit: z.enum(['g', 'kg', 'oz', 'lbs', 'handfuls', 'parts', 'other']),
      customUnit: safeString(20).nullable().optional(),
    })),
    notes: safeString(2000).nullable().optional(),
    targetSpecies: z.array(safeString(100)).optional(),
    waterTempRange: safeString(50).nullable().optional(),
    seasons: z.array(z.enum(['Spring', 'Summer', 'Fall', 'Winter'])).optional(),
  }).nullable().optional(),

  // Multiple fish entries
  fishEntries: z.array(z.object({
    species: safeString(200).nullable().optional(),
    scientificName: safeString(200).nullable().optional(),
    weight: z.union([z.number(), z.string().transform(Number)])
      .pipe(z.number().positive().max(10000))
      .nullable()
      .optional(),
    length: z.union([z.number(), z.string().transform(Number)])
      .pipe(z.number().positive().max(2000))
      .nullable()
      .optional(),
    imageUrl: safeString(2000).nullable().optional(),
    bait: safeString(200).nullable().optional(),
    method: safeString(200).nullable().optional(),
    rating: z.union([z.number(), z.string().transform(Number)])
      .pipe(z.number().int().min(1).max(5))
      .nullable()
      .optional(),
  })).optional(),
});

export const updateCatchSchema = createCatchSchema.partial();

export type CreateCatchInput = z.infer<typeof createCatchSchema>;
export type UpdateCatchInput = z.infer<typeof updateCatchSchema>;

// ============================================
// Comment Validation
// ============================================

export const createCommentSchema = z.object({
  content: safeString(2000).min(1, 'Comment cannot be empty'),
});

export const updateCommentSchema = z.object({
  content: safeString(2000).min(1, 'Comment cannot be empty'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

// ============================================
// Reaction Validation
// ============================================

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(10), // Emoji can be multi-codepoint
});

export type ReactionInput = z.infer<typeof reactionSchema>;

// ============================================
// Saved Location Validation
// ============================================

export const createSavedLocationSchema = z.object({
  name: safeString(200).min(1, 'Name is required'),
  latitude: z.union([z.number(), z.string().transform(Number)])
    .pipe(latitudeSchema),
  longitude: z.union([z.number(), z.string().transform(Number)])
    .pipe(longitudeSchema),
  notes: safeString(1000).nullable().optional(),
  type: z.enum(['fishing_spot', 'landmark', 'other']).optional().default('fishing_spot'),
});

export const updateSavedLocationSchema = createSavedLocationSchema.partial();

export type CreateSavedLocationInput = z.infer<typeof createSavedLocationSchema>;
export type UpdateSavedLocationInput = z.infer<typeof updateSavedLocationSchema>;

// ============================================
// User Preferences Validation
// ============================================

export const userPreferencesSchema = z.object({
  language: z.enum(['en', 'ru', 'es', 'de', 'fr', 'pt', 'it', 'uk']).optional(),
  showTelegramHandle: z.boolean().optional(),
  showCountryBadge: z.boolean().optional(),
  catchViewMode: z.enum(['grid', 'list']).optional(),
  notificationsEnabled: z.boolean().optional(),
  notifyOnLikes: z.boolean().optional(),
  notifyOnComments: z.boolean().optional(),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

// ============================================
// Bug Report Validation
// ============================================

export const bugReportSchema = z.object({
  description: safeString(5000).min(10, 'Please provide a detailed description'),
  deviceInfo: safeString(500).optional(),
  appVersion: safeString(50).optional(),
});

export type BugReportInput = z.infer<typeof bugReportSchema>;

// ============================================
// Map Query Validation
// ============================================

export const mapBoundsSchema = z.object({
  minLat: z.string().transform(Number).pipe(latitudeSchema),
  maxLat: z.string().transform(Number).pipe(latitudeSchema),
  minLng: z.string().transform(Number).pipe(longitudeSchema),
  maxLng: z.string().transform(Number).pipe(longitudeSchema),
});

export type MapBoundsInput = z.infer<typeof mapBoundsSchema>;

// ============================================
// Referral Validation
// ============================================

export const referralCodeSchema = z.string()
  .regex(/^FISH-[A-Z0-9]{6}$/, 'Invalid referral code format');

// ============================================
// Pagination Validation
// ============================================

export const paginationSchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
  cursor: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================
// Helper: Validate and parse
// ============================================

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function formatZodError(error: z.ZodError): string {
  return error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

