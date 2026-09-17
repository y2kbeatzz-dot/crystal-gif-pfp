# Cloudflare setup

The service is not deployed yet. Stay on Cloudflare's Free plan unless you independently choose to upgrade. GitHub distribution is free; Chrome Web Store registration is separate.

## 1. Create the database

Install Node.js LTS from its official site. Open a terminal in `server`:

```powershell
npm install
npx wrangler login
npx wrangler d1 create crystal-shared-pfp
```

Copy the returned database ID into `server/wrangler.jsonc`, replacing `REPLACE_WITH_CREATED_DATABASE_ID`. Use the database returned for this project; do not modify another project's database.

```powershell
npx wrangler d1 execute crystal-shared-pfp --remote --file=schema.sql
```

## 2. Configure verification and administration

In Google Cloud Console, create/select a project and enable **YouTube Data API v3**. Create an API key restricted to that API. Keep it out of GitHub and chat. The service only reads public channel information to check the code in a channel description.

Store it directly in Cloudflare's secret prompt:

```powershell
npx wrangler secret put YOUTUBE_API_KEY
```

Generate a separate long random admin token in a password manager. Store it in that manager and in Cloudflare:

```powershell
npx wrangler secret put ADMIN_TOKEN
```

Never include secrets in `wrangler.jsonc`, `config.js`, a screenshot, a commit, or an issue.

## 3. Deploy

```powershell
npx wrangler deploy
```

Open the URL printed by Wrangler with `/health` appended. Expect `service: crystal-shared-pfp`, `version: 2`, and `verificationConfigured: true`. Its `/privacy` page is the policy URL. Scheduled daily cleanup removes expired profiles, challenges and rate-limit records.

## 4. Build one shared extension for everyone

Back in the project root:

```powershell
python scripts/package.py --api https://YOUR-ACTUAL-WORKER-URL
```

Use the exact deployed origin printed by Wrangler. This adds only that origin to host permissions, keeping permissions narrow. Upload `dist/Crystal-GIF-PFP.zip` to a new GitHub release. All community members must use that build or the same server URL.

Update the README status once verified. The unconfigured source build intentionally keeps shared controls disabled.

## 5. Acceptance check

- In one Chrome profile, upload a small looping GIF, verify your real channel, and publish.
- In a second Chrome profile with the same extension build, enable community pictures. Open your channel, a video and a comment you authored.
- Confirm the GIF replaces only your avatar, navigation keeps it animated, and turning shared pictures off restores normal avatars.
- Delete your shared profile; check that it disappears for the second viewer after caches expire (allow five minutes).
- Confirm ordinary YouTube visitors without the extension still see the normal picture.

## Operating the service

`GET /admin/reports` returns reported channel IDs. `POST /admin/block` with a JSON `channel` ID removes its profile and blocks future publishing. Both require `Authorization: Bearer <ADMIN_TOKEN>`. Do not send the admin token to the extension or to public issue threads.

For privacy removal requests, verify the requester controls the channel before using administrative removal. Monitor reports and Cloudflare quotas before opening registration widely. Shared GIFs are capped at 512 KB; D1 is suitable for a small community, but a larger service should migrate image storage and add stronger anti-abuse controls before scaling.

Official references:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.google.com/youtube/v3/docs/channels/list
