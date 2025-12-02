import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Query,
  type Types,
} from "mongoose";

import { Event } from "./event.model";

// Shape of a Booking as used in application code (input payload).
export interface BookingAttrs {
  eventId: Types.ObjectId;
  email: string;
}

// Document type persisted in MongoDB (includes timestamps).
export interface BookingDocument extends Document, BookingAttrs {
  createdAt: Date;
  updatedAt: Date;
}

export type BookingModel = Model<BookingDocument, BookingQueryHelpers> & {
  findByEventId(eventId: Types.ObjectId | string): Promise<BookingDocument[]>;
  findByEmail(email: string): Promise<BookingDocument[]>;
  countByEventId(eventId: Types.ObjectId | string): Promise<number>;
};

export interface BookingQueryHelpers {
  byEventId(
    this: Query<BookingDocument[], BookingDocument, BookingQueryHelpers>,
    eventId: Types.ObjectId | string,
  ): Query<BookingDocument[], BookingDocument, BookingQueryHelpers>;
  byEmail(
    this: Query<BookingDocument[], BookingDocument, BookingQueryHelpers>,
    email: string,
  ): Query<BookingDocument[], BookingDocument, BookingQueryHelpers>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<
  BookingDocument,
  BookingModel,
  Record<string, never>,
  BookingQueryHelpers
>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email address cannot exceed 254 characters"],
      validate: {
        validator: (value: string) => EMAIL_REGEX.test(value),
        message: "Invalid email address format",
      },
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt.
    versionKey: false,
    strict: true,
  },
);

// Index on eventId for faster queries.
bookingSchema.index({ eventId: 1 });

// Compound index for common queries (event bookings by date).
bookingSchema.index({ eventId: 1, createdAt: -1 });

// Index on email for user booking lookups.
bookingSchema.index({ email: 1 });

// Enforce one booking per event per email.
bookingSchema.index({ eventId: 1, email: 1 }, { unique: true, name: "uniq_event_email" });

// Pre-save hook: ensure a referenced event exists and email is well-formed.
bookingSchema.pre<BookingDocument>("save", async function preSaveBooking() {
  if (!EMAIL_REGEX.test(this.email)) {
    throw new Error("Invalid email address.");
  }

  const eventExists = await Event.exists({ _id: this.eventId }).lean();

  if (!eventExists) {
    throw new Error("Cannot create booking: referenced event does not exist.");
  }
});

// Query helpers for common lookups.
bookingSchema.query.byEventId = function (
  this: Query<BookingDocument[], BookingDocument, BookingQueryHelpers>,
  eventId: Types.ObjectId | string,
) {
  return this.find({ eventId });
};

bookingSchema.query.byEmail = function (
  this: Query<BookingDocument[], BookingDocument, BookingQueryHelpers>,
  email: string,
) {
  return this.find({ email: email.toLowerCase() });
};

// Static methods for better API.
bookingSchema.statics.findByEventId = async function (
  eventId: Types.ObjectId | string,
) {
  return this.find({ eventId }).lean();
};

bookingSchema.statics.findByEmail = async function (email: string) {
  return this.find({ email: email.toLowerCase() }).lean();
};

bookingSchema.statics.countByEventId = async function (
  eventId: Types.ObjectId | string,
) {
  return this.countDocuments({ eventId });
};

export const Booking: BookingModel =
  (models.Booking as BookingModel | undefined) ??
  model<BookingDocument, BookingModel>("Booking", bookingSchema);
