# WA Mockup Builder

A browser-based React tool for designing realistic WhatsApp conversation mockups. It supports text, image, video, audio, PDF, link previews, quick replies, lists, CTA buttons, product carousels, flows, multi-select messages, PNG export, and JSON conversation editing.

## Run locally

`node_modules` should not be committed. Recreate it from the lockfile:

```bash
npm ci
npm run dev
```

Create a production build with:

```bash
npm run build
npm run preview
```

## Deploy

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds and publishes the app to GitHub Pages after every push to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once.

Conversation data is saved in the current browser's local storage. Uploaded media is stored as data URLs, so very large files can exceed the browser storage limit.


