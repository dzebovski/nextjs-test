import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/database/event.model";

export async function POST(req: NextRequest) {
  try {
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

    const createdEvent = await Event.create(event);

    return NextResponse.json(
      {
        message: "Event created successfully!",
        event: createdEvent,
      },
      {
        status: 201,
      },
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
