# Residence.io Web

The Next.js App Router frontend uses the existing administration and resident shells and calls the NestJS API through `NEXT_PUBLIC_API_URL`. It never imports Prisma or connects to PostgreSQL directly.

The production build uses system fonts, so it does not require Google Fonts network access, and emits Next.js standalone output for `Dockerfile.web`. From the repository root use `npm run dev --workspace web`, `npm run test --workspace web`, or `npm run build --workspace web`.
