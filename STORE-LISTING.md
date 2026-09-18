# Future Chrome Web Store listing — do not submit until acceptance testing is complete

Name: Crystal GIF PFP for YouTube

Summary: Use a GIF profile picture locally, or share channel GIFs with other Crystal extension users without editing your channel description.

Description:
Crystal adds animated profile pictures to your own YouTube browsing experience. Pick a GIF from your computer, select your picture, and keep it applied as you move between videos. Turn it off whenever you want.

Optional community mode lets extension users see GIFs published by connected channels. Publishing does not require a temporary code in your public channel description. The user selects the signed-in top-right YouTube avatar and enters a handle; the service compares that selected avatar key with the channel's public avatar key before issuing a publishing credential.

People without this extension still see the normal YouTube picture. Crystal is independent and is not affiliated with Google or YouTube.

Single purpose: Customize the display of YouTube channel avatars with local or shared GIFs.

Permission explanations:
- storage: Store the selected GIF, local preferences, selected avatar key and management credential in trusted extension storage.
- activeTab: Identify the user's active YouTube tab when they click Select my picture.
- scripting: Attach the bundled content script to an already-open YouTube tab when needed.
- www.youtube.com: Detect and replace avatar images as pages change and let the user select their signed-in avatar.
- The single configured service origin: Look up shared profiles, connect a channel by avatar match, publish/delete GIFs and submit reports.

Remote code: None. The service returns JSON and GIF images only; all executable extension code is bundled.

Data disclosure: Shared mode transmits visible channel IDs/handles. Publishing stores the public GIF, channel association, title, avatar key and timestamps. The service stores hashed access tokens and hashed IP rate-limit buckets. The avatar-match connection is a convenience check, not Google OAuth or cryptographic proof of ownership. Reflect this accurately in the store privacy form.

Assets: icon128.png (128 × 128), promo-small.png (440 × 280), promo.png (1280 × 800 promotional artwork). Capture a real v2.5.0 extension screenshot before store submission.

Before submission: deploy Worker v5, test 1 MB community sharing with two Chrome profiles, supply a working publisher support contact and hosted privacy-policy URL, and complete Google's developer registration.

Community media limit: Shared GIFs are limited to 1 MB and 512 × 512 px. Local GIFs can be up to 5 MB.
