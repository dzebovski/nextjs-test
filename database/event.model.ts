import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Query,
} from "mongoose";

// Shape of an Event as used in application code (input payload).
export interface EventAttrs {
  title: string;
  slug?: string; // generated automatically from a title
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // stored as ISO date string (YYYY-MM-DD)
  time: string; // stored as 24h "HH:mm"
  mode: string; // e.g., online, offline, hybrid
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  // optional ownership metadata (e.g., user id/email or the string "apiKey")
  createdBy?: string;
}

// Document type persisted in MongoDB (includes timestamps and non-optional slug).
export interface EventDocument extends Document, Omit<EventAttrs, "slug"> {
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EventModel = Model<EventDocument, EventQueryHelpers> & {
  findBySlug(slug: string): Promise<EventDocument | null>;
  findUpcoming(): Promise<EventDocument[]>;
};

export interface EventQueryHelpers {
  bySlug(
    this: Query<EventDocument | null, EventDocument, EventQueryHelpers>,
    slug: string,
  ): Query<EventDocument | null, EventDocument, EventQueryHelpers>;
  upcoming(
    this: Query<EventDocument[], EventDocument, EventQueryHelpers>,
  ): Query<EventDocument[], EventDocument, EventQueryHelpers>;
}

// Helper to generate a URL-safe slug from the event title.
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize a date string to ISO format (YYYY-MM-DD).
function normalizeDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid event date: must be a valid date string.");
  }
  // Keep only the calendar date portion.
  return parsed.toISOString().slice(0, 10);
}

// Normalize a time string to 24-hour "HH:mm" format.
function normalizeTime(timeStr: string): string {
  const trimmed = timeStr.trim();
  // Accept formats like "9:00", "09:00", "9:00 am", "9:00 PM".
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);

  if (!match) {
    throw new Error(
      "Invalid event time: must be in HH:mm or H:mm AM/PM format (e.g. '09:00' or '9:00 PM').",
    );
  }

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (minutes < 0 || minutes > 59) {
    throw new Error("Invalid event time: minutes must be between 00 and 59.");
  }

  if (period) {
    // Convert 12h clock to 24h.
    if (period === "PM" && hours < 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
  }

  if (hours < 0 || hours > 23) {
    throw new Error("Invalid event time: hours must be between 00 and 23.");
  }

  const normalizedHours = hours.toString().padStart(2, "0");
  const normalizedMinutes = minutes.toString().padStart(2, "0");

  return `${normalizedHours}:${normalizedMinutes}`;
}

const eventSchema = new Schema<
  EventDocument,
  EventModel,
  Record<string, never>,
  EventQueryHelpers
>(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Event title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: [2000, "Event description cannot exceed 2000 characters"],
    },
    overview: {
      type: String,
      required: [true, "Event overview is required"],
      trim: true,
      maxlength: [500, "Event overview cannot exceed 500 characters"],
    },
    image: {
      type: String,
      required: [true, "Event image is required"],
      trim: true,
      maxlength: [500, "Event image URL cannot exceed 500 characters"],
    },
    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
      maxlength: [200, "Event venue cannot exceed 200 characters"],
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
      maxlength: [200, "Event location cannot exceed 200 characters"],
    },
    date: {
      type: String,
      required: [true, "Event date is required"],
      trim: true,
      maxlength: [10, "Event date cannot exceed 10 characters"],
    },
    time: {
      type: String,
      required: [true, "Event time is required"],
      trim: true,
      maxlength: [5, "Event time cannot exceed 5 characters"],
    },
    mode: {
      type: String,
      required: [true, "Event mode is required"],
      trim: true,
      enum: {
        values: ["online", "offline", "hybrid"],
        message: "Event mode must be one of: online, offline, hybrid",
      },
    },
    audience: {
      type: String,
      required: [true, "Event audience is required"],
      trim: true,
      maxlength: [200, "Event audience cannot exceed 200 characters"],
    },
    agenda: {
      type: [String],
      default: [],
    },
    organizer: {
      type: String,
      required: [true, "Event organizer is required"],
      trim: true,
      maxlength: [200, "Event organizer cannot exceed 200 characters"],
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      trim: true,
      maxlength: [200, "createdBy cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt.
    versionKey: false,
    strict: true,
  },
);

// Unique index on slug ensures events can be looked up by stable URL segment.
eventSchema.index({ slug: 1 }, { unique: true });

// Compound index for filtering events by date (useful for upcoming events queries).
eventSchema.index({ date: 1, time: 1 });

// Index for tag-based searches.
eventSchema.index({ tags: 1 });

// Pre-save hook: validate required fields, normalize date/time, and generate slug.
eventSchema.pre<EventDocument>("save", function preSaveEvent() {
  type StringField =
    | "title"
    | "description"
    | "overview"
    | "image"
    | "venue"
    | "location"
    | "date"
    | "time"
    | "mode"
    | "audience"
    | "organizer";

  const requiredStringFields: StringField[] = [
    "title",
    "description",
    "overview",
    "image",
    "venue",
    "location",
    "date",
    "time",
    "mode",
    "audience",
    "organizer",
  ];

  // Ensure required string fields are present and non-empty after trimming.
  for (const field of requiredStringFields) {
    const value = this[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(
        `Field "${field}" is required and must be a non-empty string.`,
      );
    }
  }

  // Validate agenda and tags arrays (if provided) contain only non-empty strings.
  const validateStringArray = (
    name: "agenda" | "tags",
    value: string[],
  ): void => {
    if (!Array.isArray(value)) {
      throw new Error(`Field "${name}" must be an array of strings.`);
    }

    for (const item of value) {
      if (typeof item !== "string" || item.trim().length === 0) {
        throw new Error(`Field "${name}" must contain only non-empty strings.`);
      }
    }
  };

  if (this.agenda.length > 0) {
    validateStringArray("agenda", this.agenda);
  }
  if (this.tags.length > 0) {
    validateStringArray("tags", this.tags);
  }

  // Regenerate slug only when the title changes or when it has not been set yet.
  if (!this.slug || this.isModified("title")) {
    this.slug = slugify(this.title);
  }

  // Normalize date and time into consistent formats for storage and querying.
  this.date = normalizeDate(this.date);
  this.time = normalizeTime(this.time);
});

// Query helpers for common lookups.
eventSchema.query.bySlug = function (
  this: Query<EventDocument | null, EventDocument, EventQueryHelpers>,
  slug: string,
) {
  return this.findOne({ slug });
};

eventSchema.query.upcoming = function (
  this: Query<EventDocument[], EventDocument, EventQueryHelpers>,
) {
  const today = new Date().toISOString().slice(0, 10);
  return this.find({ date: { $gte: today } }).sort({ date: 1, time: 1 });
};

// Static methods for better API.
eventSchema.statics.findBySlug = async function (slug: string) {
  return this.findOne({ slug }).lean();
};

eventSchema.statics.findUpcoming = async function () {
  const today = new Date().toISOString().slice(0, 10);
  return this.find({ date: { $gte: today } })
    .sort({ date: 1, time: 1 })
    .lean();
};

export const Event: EventModel =
  (models.Event as EventModel | undefined) ??
  model<EventDocument, EventModel>("Event", eventSchema);
