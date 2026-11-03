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

## Design tokens

The UI runs on CSS custom properties defined in `app/globals.css` (`--ink-*`,
`--text`, `--dim`, `--faint`, `--jade`, `--amber`, `--azure`, `--coral`,
`--ink-on-accent`, `--jade-light`, the radius scale). Components should use
`var(--token)` rather than literal colours.

`scripts/check-design-tokens.mjs` guards that. Run it by hand:

```bash
npm run check:tokens
```

**It is a ratchet, not a clean bill of health.** It passes with roughly 1,331
hardcoded colour references still in the repo, in `app/admin/**` and
`app/focus-flight/**`, which are whitelisted because those screens were never
migrated. Green means only that no *new* violations were added and the swept
screens stayed swept.

**It should run in CI when there is CI.** It is deliberately not wired into
`build` or `prebuild`: a ratchet that blocks deploys on day one gets deleted on
day two. Add it as its own CI step once a pipeline exists, and delete a
whitelist entry only when that screen has actually been migrated.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
