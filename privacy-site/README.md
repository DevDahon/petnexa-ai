# PetNexa AI Privacy Policy Site

Plain static privacy-policy website for PetNexa AI, modeled after the Interna privacy site and maintained independently from the Expo app runtime.

## Files

- `index.html`
- `styles.css`
- `script.js`
- `image.png`
- `app-ads.txt`

## Before publishing

1. Update `script.js` if needed:
   - `effectiveDate`
   - `contactEmail`
   - `developerName`
2. Keep `index.html` aligned with the live app behavior, especially:
   - Home Furparent sync through Supabase Auth, database tables, and private Storage assets
   - AI consultation payloads sent through the Supabase/API proxy to Gemini or Groq
   - rewarded-ad credit handling through Google Mobile Ads
   - local backup and restore behavior
   - camera/gallery photos for pet profiles and health-record attachments
3. Host this folder on a public static host.
4. Use the final public URL wherever Google Play, app stores, or app metadata require a privacy-policy URL.

## Local preview

Open `index.html` directly in a browser, or serve this folder with any static file server.
