# Yulaverse Studio portfolio

A production-ready portfolio for Yulaverse Studio, built with Next.js App Router, TypeScript, Tailwind CSS and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

## Enquiry delivery

The enquiry form performs client-side and server-side validation. By design, it does **not** claim an enquiry was delivered unless a provider is configured.

Copy `.env.example` to `.env.local` and set:

```bash
CONTACT_WEBHOOK_URL=https://your-secure-endpoint.example/enquiries
```

The endpoint must accept a JSON `POST`. Keep provider credentials and spam/rate-limiting logic in that secure endpoint. When the variable is absent, the interface tells the visitor to email `hello@yulaverse.studio` instead.

## Editable content

- Case-study content: `data/case-studies.ts`
- Services and process content: `components/services.tsx` and `components/process.tsx`
- About placeholders: `components/about.tsx`
- Contact choices and validation: `data/contact.ts`
- Email, social profiles and footer navigation: `components/footer.tsx`

All three portfolio entries are labelled as concept projects. Replace their data without changing the reusable route or card components.

## Brand assets

The supplied brand-board PNG is preserved at `public/brand/yulaverse-brand-board.png`. All site logos are lossless crops of that supplied source, with no redrawing, recolouring, distortion or regeneration:

- `logo-horizontal-dark-mono.png`
- `logo-horizontal-light.png`
- `logo-stacked-dark.png`
- `logo-stacked-light.png`
- `monogram-dark.png`
- `monogram-light.png`
- `favicon.png`

## Production notes

- Update `metadataBase` in `app/layout.tsx` if the final domain changes.
- Replace placeholder founder and story content before launch.
- Replace generic social profile URLs with studio-specific destinations.
- Add rate limiting and bot protection at the deployment edge or webhook provider.
