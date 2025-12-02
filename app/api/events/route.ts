import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/database/event.model";

// Configure Cloudinary with environment variables
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Validate Cloudinary environment variables
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(
    "Missing Cloudinary API environment variables. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.",
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});


export async function POST(req: NextRequest) {
  try {
    // Public event creation (no token required)

    await connectToDatabase();

    let event;
    let formData: FormData | undefined; // Declare formData in outer scope

    try {
      formData = await req.formData(); // Assign formData inside try block
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

    // Validate that formData exists before using it
    if (!formData) {
      return NextResponse.json(
        { message: "Form data is missing." },
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

    // Define a type for the Cloudinary upload result
    interface CloudinaryUploadResult {
      secure_url: string;
    }

    let uploadResult: CloudinaryUploadResult | undefined;

    try {
      uploadResult = await new Promise<CloudinaryUploadResult | undefined>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: "image", folder: "NextJs16_Events" },
              (error, result) => {
                if (error) {
                  // Reject the promise with the original error
                  return reject(error);
                }
                // Resolve with the result, which could be undefined
                resolve(result as CloudinaryUploadResult | undefined);
              },
            )
            .end(buffer);
        },
      );
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      return NextResponse.json(
        { message: "Image upload failed." },
        { status: 500 },
      );
    }

    // Validate that the upload result and secure_url exist
    if (!uploadResult || !uploadResult.secure_url) {
      return NextResponse.json(
        { message: "Image upload failed to return a secure URL." },
        { status: 500 },
      );
    }

    event.image = uploadResult.secure_url;

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
