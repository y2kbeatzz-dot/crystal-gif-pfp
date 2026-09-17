<div align="center">
<img src="store-assets/icon128.png" width="112" alt="Crystal GIF PFP icon">

# Crystal GIF PFP

**Your YouTube picture, with a little motion.**

Local animated profile pictures · Optional verified community sharing · Dark purple UI

[Download the shared extension](https://github.com/y2kbeatzz-dot/crystal-gif-pfp/archive/refs/heads/main.zip) · [Report an issue](https://github.com/y2kbeatzz-dot/crystal-gif-pfp/issues)

</div>

## Current status

**The shared service is deployed, and the download is already connected.** Install the extension to use local GIFs or opt into community sharing. No server setup or API key is needed for users. This is a GitHub preview, not a Chrome Web Store listing. Live channel verification and sharing between browsers still need acceptance testing.

Only people using this extension and the same shared service can see each other's published GIFs. Everyone else still sees the normal YouTube picture. This extension does not change the public picture on Google's servers.

![Crystal GIF PFP promotional artwork](store-assets/promo.png)

## Install in Chrome

1. [Download the project ZIP](https://github.com/y2kbeatzz-dot/crystal-gif-pfp/archive/refs/heads/main.zip) and use **Extract All** into a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked**, open the extracted `crystal-gif-pfp-main` folder, and select its **extension** folder (the one containing `manifest.json`).
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

## Share your GIF

1. Enable **See other members' GIFs** if you want community pictures.
2. Open **Share my GIF**, enter your YouTube handle, and start verification.
3. Add the temporary code to your public channel description in YouTube Studio.
4. Click **Check code**, then remove the code from your description.
5. Confirm you have permission to share the image and click **Publish my GIF**.

Publishing is public. You can remove it with **Delete shared profile**. Uninstalling the extension alone does not remove a published profile. Reverify your channel if you lose management access. Others must install a build using the same API origin.

## Privacy

Local mode makes no requests to the shared service. Shared mode sends visible channel IDs or handles for lookup; it does not send video URLs, comments, or video titles. The service stores published GIFs, channel metadata, verification timestamps and hashed management tokens. Management credentials stay in trusted extension storage, away from YouTube page scripts. See [the privacy policy](extension/privacy.html).

## Limitations and testing

Server integration tests use a real in-memory SQLite database with a mocked YouTube API. They cover verification, invalid tokens, replay rejection, publishing, separate viewer lookups, removal, request limits and validation. The deployed service responds to health checks and has its verification secret configured. Live YouTube compatibility, successful channel verification and sharing between browsers still need acceptance testing.

YouTube can change its markup. Shared matching currently covers linked avatars, comment authors and channel headers where the channel and original avatar can be identified. Live chat, YouTube Studio, mobile apps, unlinked avatars and every possible YouTube layout are not guaranteed. The local image-address match can also affect identical/default pictures; use a unique original avatar. If a channel changes its normal avatar or handle, reverify to refresh its shared mapping.

## Credits

Built by [Crystal / Nitta Hoshi](https://github.com/y2kbeatzz-dot). The original purple loop-avatar icon was generated with AI. This project is independent and is not affiliated with or endorsed by Google or YouTube.
