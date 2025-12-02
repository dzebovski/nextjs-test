import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { EventDocument } from "@/database";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
  const response = await fetch(`${BASE_URL}/api/events`);
  const { events } = await response.json();

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
