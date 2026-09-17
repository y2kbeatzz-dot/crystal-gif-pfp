# Future Chrome Web Store listing — do not submit until hosting is live

Name: Crystal GIF PFP for YouTube

Summary: Use a GIF profile picture locally, or share verified channel GIFs with other Crystal extension users.

Description:
Crystal adds animated profile pictures to your own YouTube browsing experience. Pick a GIF from your computer, select your picture, and keep it applied as you move between videos. Turn it off whenever you want.

Optional community mode lets extension users see GIFs published by verified channels. Publishing requires a temporary code in your public channel description. You control whether you publish, see shared GIFs, or delete your shared profile.

People without this extension still see your normal picture. Crystal is independent and is not affiliated with Google or YouTube.

Single purpose: Customize the display of YouTube channel avatars with local or verified shared GIFs.

Permission explanations:
- storage: Store the selected GIF, local preferences, verification state and management credential in trusted extension storage.
- activeTab: Identify the user's active YouTube tab when they click Select my picture.
- scripting: Attach the bundled content script to an already-open YouTube tab when needed.
- www.youtube.com: Detect and replace avatar images as pages change.
- The single configured service origin: Look up shared profiles, verify channels, publish/delete GIFs and submit reports.

Remote code: None. The service returns JSON and GIF images only; all executable code is bundled.

Data disclosure: Shared mode transmits visible channel IDs/handles. Publishing stores the public GIF, channel association, title, avatar key and timestamps. The service stores hashed access tokens, short-lived verification records and hashed IP rate-limit buckets. Reflect this accurately in the store's privacy form; do not declare that the entire shared product processes no user data.

Assets: icon128.png (128 × 128), promo-small.png (440 × 280), promo.png (1280 × 800 promotional artwork). A real extension screenshot is still required before store submission; capture it after deployment and acceptance testing.

Before submission: deploy the service, configure the release origin, verify with two Chrome profiles, supply a working publisher support contact and hosted privacy-policy URL, and complete Google's developer registration. Do not describe community sharing as live before these steps are done.
