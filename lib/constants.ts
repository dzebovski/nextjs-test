// Centralized event data for use across the app
// Images must reference files under public/images

export type EventItem = {
  title: string;
  image: string; // path under /public, e.g. "/images/event1.png"
  slug: string;
  location: string;
  date: string; // human-friendly date, e.g. "June 2–6, 2025"
  time: string; //  time string if needed by UI
};

export const events: EventItem[] = [
  {
    title: "WWDC 2025",
    image: "/images/event1.png",
    slug: "wwdc-2025",
    location: "Cupertino, CA + Online",
    date: "June 2–6, 2025",
    time: "Daily 10:00 AM–6:00 PM PT (Keynote Mon 10:00 AM PT)",
  },
  {
    title: "Google I/O 2025",
    image: "/images/event2.png",
    slug: "google-io-2025",
    location: "Mountain View, CA + Online",
    date: "May 2025 (TBA)",
    time: "TBA (typically 10:00 AM–4:00 PM PT)",
  },
  {
    title: "Microsoft Build 2025",
    image: "/images/event3.png",
    slug: "microsoft-build-2025",
    location: "Seattle, WA + Online",
    date: "May 2025 (TBA)",
    time: "TBA (sessions commonly 9:00 AM–5:00 PM PT)",
  },
  {
    title: "KubeCon + CloudNativeCon Europe 2025",
    image: "/images/event4.png",
    slug: "kubecon-eu-2025",
    location: "London, UK",
    date: "April 1–4, 2025",
    time: "08:30 AM–6:00 PM BST",
  },
  {
    title: "Next.js Conf 2025",
    image: "/images/event5.png",
    slug: "nextjs-conf-2025",
    location: "Online",
    date: "October 2025 (TBA)",
    time: "TBA (last year ~10:00 AM–2:00 PM PT)",
  },
  {
    title: "DEF CON 33",
    image: "/images/event6.png",
    slug: "defcon-33",
    location: "Las Vegas, NV",
    date: "August 7–10, 2025",
    time: "Talks 10:00 AM–6:00 PM PT (villages/CTFs often 24/7)",
  },
  {
    title: "ETHGlobal Hackathon (Paris)",
    image: "/images/event-full.png",
    slug: "ethglobal-paris-2025",
    location: "Paris, France",
    date: "July 2025 (TBA)",
    time: "TBA (hacking typically runs 24/7 over the weekend)",
  },
];

export default events;
