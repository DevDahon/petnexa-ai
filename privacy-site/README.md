# PetNexa AI Privacy Policy Site

Plain static privacy-policy website for PetNexa AI, modeled after the Interna privacy site and maintained independently from the Expo app runtime.

## Files

- `index.html`
- `styles.css`
- `script.js`
- `image.png`
- `screenshots/`
- `capture-screenshots.mjs`
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

## Refresh app screenshots

The preview screenshots must use demo data only. Do not sign in with a real
account or capture real pet, owner, clinic, or record data.

1. Start the Expo web app:
   ```powershell
   npx expo start --web --port 8098
   ```
2. Start Chrome with a temporary profile and DevTools enabled:
   ```powershell
   & 'C:\Program Files\Google\Chrome\Application\chrome.exe' --disable-gpu --disable-crash-reporter --disable-crashpad --no-first-run --no-default-browser-check --remote-debugging-address=127.0.0.1 --remote-debugging-port=9224 --user-data-dir="$PWD\.tmp-chrome-cdp" --window-size=430,932 about:blank
   ```
3. Capture the mobile screenshots:
   ```powershell
   node privacy-site\capture-screenshots.mjs
   ```
4. Review every image in `privacy-site/screenshots/` before committing:
   - `01-onboarding-login.png`
   - `02-dashboard.png`
   - `03-my-pets.png`
   - `04-records.png`
   - `05-ai-assistant.png`
   - `06-settings-privacy-controls.png`

The capture script clears browser storage for onboarding, then injects a local
demo snapshot for app screens. The images are informational website assets and
do not replace the written privacy policy.
