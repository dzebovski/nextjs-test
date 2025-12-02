import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { EventDocument } from "@/database";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_BASE_URL environment variable is required and must be set.",
  );
}

const Page = async () => {
  let events: EventDocument[] = []; // Default to an empty array

  try {
    const response = await fetch(`${BASE_URL}/api/events`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      // Log the error for debugging, but don't crash the page
      console.error(`HTTP error! status: ${response.status}`);
    } else {
      const data = await response.json();
      events = data.events || []; // Ensure events is an array
    }
  } catch (error) {
    // Log the error for debugging
    console.error("Failed to fetch events:", error);
    // The page will render with an empty events array
  }

  return (
    <section>
      <h1 className="text-center">
        Hello World <br /> Event you can&rsquo;t miss
      </h1>
      <p className="text-center mt-5">
        There is something going on hello world again
      </p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured:</h3>

        <ul className="events">
          {events &&
            events.length > 0 &&
            events.map((item: EventDocument) => (
              <li style={{ textDecoration: "none" }} key={item.title}>
                <EventCard {...item} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
};

export default Page;
