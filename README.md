<div align="center">
<img src="store-assets/icon128.png" width="112" alt="Crystal GIF PFP icon">

# Crystal GIF PFP

**Your YouTube picture, with a little motion.**

Local animated profile pictures · Optional verified community sharing · Dark purple UI

[Download the latest build](https://github.com/y2kbeatzz-dot/crystal-gif-pfp/releases) · [Report an issue](https://github.com/y2kbeatzz-dot/crystal-gif-pfp/issues) · [Cloudflare setup](CLOUDFLARE-SETUP.md)

</div>

## Current status

**Local mode is available. The shared-service implementation is included, but the public Cloudflare service is not deployed yet.** Community controls remain disabled until a build is configured with a deployed service. This is a GitHub preview release, not a Chrome Web Store listing.

Only people using this extension and the same shared service can see each other's published GIFs. Everyone else still sees the normal YouTube picture. This extension does not change the public picture on Google's servers.

![Crystal GIF PFP promotional artwork](store-assets/promo.png)

## Install in Chrome

1. Download `Crystal-GIF-PFP.zip` from Releases and extract it into a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Refresh YouTube once. Open Crystal from Chrome's puzzle menu.
5. Choose a GIF, click **Select my picture on YouTube**, then click your profile picture.

To update without losing your saved GIF, replace the files in the same folder, click **Reload** on the extension, and refresh your open YouTube tabs. Do not remove the extension first.

## What it does

- Saves a local GIF and restores it as YouTube changes videos or pages.
- Enables shared pictures only when the viewer opts in.
- Verifies a publishing channel using a temporary code in its public description.
- Publishes one GIF per verified channel, with deletion and 30-day verification renewal.
- Matches shared GIFs using a channel link plus its verified avatar image address.
- Includes local blocking, reporting, and operator removal tools.

A shared GIF must be at most **512 KB** and **512 × 512 pixels**. Local GIFs can be up to **5 MB**. Use a looping GIF for continuous playback; new image elements start from the first frame.

## Shared profiles — after deployment

1. Enable **See other members' GIFs** if you want community pictures.
2. Open **Share my GIF**, enter your YouTube handle, and start verification.
3. Add the temporary code to your public channel description in YouTube Studio.
4. Click **Check code**, then remove the code from your description.
5. Confirm you have permission to share the image and click **Publish my GIF**.

Publishing is public. You can remove it with **Delete shared profile**. Uninstalling the extension alone does not remove a published profile. Reverify your channel if you lose management access. Others must install a build using the same API origin.

## Privacy

Local mode makes no requests to the shared service. Shared mode sends visible channel IDs or handles for lookup; it does not send video URLs, comments, or video titles. The service stores published GIFs, channel metadata, verification timestamps and hashed management tokens. Management credentials stay in trusted extension storage, away from YouTube page scripts. See [the privacy policy](extension/privacy.html).

## Hosting and development

Cloudflare Workers + D1 run the service. A YouTube Data API v3 key is required on the server for public channel verification. The extension never receives that key. Free tiers have quotas; no unlimited-free hosting claim is made.

```bash
# Node 24 or newer, for the built-in SQLite test adapter
node --test server/test.mjs

# Package a local-only build
python scripts/package.py

# Package a shared build after deploying your service
python scripts/package.py --api https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev
```

See [CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md) for deployment and [STORE-LISTING.md](STORE-LISTING.md) for future store submission copy.

## Limitations and testing

Server integration tests use a real in-memory SQLite database with a mocked YouTube API. They cover verification, invalid tokens, replay rejection, publishing, separate viewer lookups, removal, request limits and validation. Live YouTube compatibility and a production Cloudflare deployment still need acceptance testing.

YouTube can change its markup. Shared matching currently covers linked avatars, comment authors and channel headers where the channel and original avatar can be identified. Live chat, YouTube Studio, mobile apps, unlinked avatars and every possible YouTube layout are not guaranteed. The local image-address match can also affect identical/default pictures; use a unique original avatar. If a channel changes its normal avatar or handle, reverify to refresh its shared mapping.

## Credits

Built by [Crystal / Nitta Hoshi](https://github.com/y2kbeatzz-dot). The original purple loop-avatar icon was generated with AI. This project is independent and is not affiliated with or endorsed by Google or YouTube.
