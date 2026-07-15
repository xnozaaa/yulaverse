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

The enquiry form validates submissions in the browser and again through `/api/contact`, filters simple bot submissions with a honeypot field, and then emails the complete brief to `yulaversestudio@gmail.com` through FormSubmit's supported AJAX delivery flow. The activated delivery token keeps the recipient address out of the form endpoint, and no email password or API key is placed in the site.

The recipient has completed FormSubmit's required one-time activation. If the delivery service is unavailable, the form clearly asks the visitor to email the studio directly instead of reporting a false success.

## Content

- Case-study content: `data/case-studies.ts`
- Services and process content: `components/services.tsx` and `components/process.tsx`
- Studio profile: `components/about.tsx`
- Contact choices and validation: `data/contact.ts`
- Email and footer navigation: `components/footer.tsx`

The portfolio currently features App Carz, A1 Walsall Radio Taxis, Tutoring for the Deaf and Shongo Shomithi. Their shared structure, verified project facts and live-site links live in `data/case-studies.ts`.

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
