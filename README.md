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

The endpoint must accept a JSON `POST`. Keep provider credentials and spam/rate-limiting logic in that secure endpoint. When the variable is absent, the interface tells the visitor to email `yulaversestudio@gmail.com` instead.

## Content

- Case-study content: `data/case-studies.ts`
- Services and process content: `components/services.tsx` and `components/process.tsx`
- Studio profile: `components/about.tsx`
- Contact choices and validation: `data/contact.ts`
- Email and footer navigation: `components/footer.tsx`

The portfolio currently features Appcarz, A1 Walsall Radio, Tutoring for the Deaf and Shongo Shomithi. Their shared structure lives in `data/case-studies.ts`.

## Brand assets

The complete official 4x logo set supplied by Yulaverse Studio is preserved exactly in `public/brand`. Duplicate exports from the source folder are stored once. The site uses no generated, redrawn or recoloured logo assets:

- `official-horizontal-black.png`
- `official-horizontal-gold.png`
- `official-horizontal-light.png`
- `official-stacked-black.png`
- `official-stacked-gold.png`
- `official-stacked-light.png`
- `official-monogram-black.png`
- `official-monogram-gold.png`
- `official-monogram-light.png`
- `official-tagline-horizontal.png`
- `official-tagline-horizontal-light-bg.png`
- `official-tagline-condensed.png`
- `official-tagline-condensed-light-bg.png`
- `official-tagline-only.png`
- `official-colour-palette.png`

The official palette is `#0C0F15`, `#C5A576`, `#F2F2F2` and `#5946D1`.

## Production notes

- Update `metadataBase` in `app/layout.tsx` if the final domain changes.
- Add rate limiting and bot protection at the deployment edge or webhook provider.
