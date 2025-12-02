This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API: Event creation (public, no token)

The `POST /api/events` endpoint is public and does not require authentication. Send a multipart form-data request including an `image` file and the required fields defined in `database/event.model.ts`:

- `title`, `description`, `overview`, `venue`, `location`, `date`, `time`, `mode`, `audience`, `organizer` (all strings)
- `image` (File upload; the server uploads it to Cloudinary and stores the URL)

Optional fields:

- `tags` (string[])
- `agenda` (string[])

Example curl:

```
curl -X POST "http://localhost:3000/api/events" \
  -H "Accept: application/json" \
  -F "title=My Great Event" \
  -F "description=A short description" \
  -F "overview=A longer overview" \
  -F "venue=Main Hall" \
  -F "location=San Francisco, CA" \
  -F "date=2025-12-31" \
  -F "time=18:00" \
  -F "mode=In-person" \
  -F "audience=Developers" \
  -F "organizer=ACME Inc" \
  -F "image=@/absolute/path/to/image.jpg"
```

Note: Since the endpoint is public, consider adding proper authentication/authorization before deploying to production.
