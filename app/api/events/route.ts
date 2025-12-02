import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/database/event.model";

export async function POST(req: NextRequest) {
  try {
    // Public event creation (no token required)

    await connectToDatabase();

    let event;

    try {
      const formData = await req.formData();
      event = Object.fromEntries(formData.entries());
    } catch (e) {
      return NextResponse.json(
        {
          message: "Invalid form data.",
          error: e instanceof Error ? e.message : "Unable to parse form data",
        },
        { status: 400 },
      );
    }

    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No image provided." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "NextJs16_Events" },
          (error, result) => {
            if (error) return reject(error);

            resolve(result);
          },
        )
        .end(buffer);
    });

    event.image = (uploadResult as { secure_url: string }).secure_url;

    // Attach minimal ownership metadata based on API key usage.
    const createdEvent = await Event.create({
      ...event,
      createdBy: "public",
    });

    return NextResponse.json(
      { message: "Event created successfully!", event: createdEvent },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        message: "Event creation failed.",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Event fetch failed.", error: e },
      { status: 500 },
    );
  }
}

export async function GET_SLUG() {
  try {
    await connectToDatabase();

    const eventsSlugs = await Event.find()
      .select("slug")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events SLUGS fetched successfully", eventsSlugs },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Event SLUGS fetch failed.", error: e },
      { status: 500 },
    );
  }
}
