import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/database";

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * GET /api/events/[slug]
 *
 * Fetch a single event by its slug.
 *
 * @param request - Next.js request object
 * @param context - Route context containing dynamic params
 * @returns JSON response with event data or error
 */
export async function GET(
  request: NextRequest,
  context: RouteParams,
): Promise<NextResponse> {
  try {
    // Extract slug from route params
    const { slug } = context.params;

    // Validate slug parameter
    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing slug parameter",
        },
        { status: 400 },
      );
    }

    // Basic slug format validation (alphanumeric and hyphens only)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens.",
        },
        { status: 400 },
      );
    }

    // Connect to database
    await connectToDatabase();

    // Fetch event by slug using static method
    const event = await Event.findBySlug(slug);

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: `Event with slug "${slug}" not found`,
        },
        { status: 404 },
      );
    }

    // Return event data
    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      { status: 200 },
    );
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error("Error fetching event by slug:", error);

    // Return generic error response
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while fetching the event",
      },
      { status: 500 },
    );
  }
}
