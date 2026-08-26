TBC API v2 Mini App — NO DATABASE

Files:
  index.html
  api/bot.js

1. Upload these files to GitHub.
2. Import the repository into Vercel.
3. Add Vercel Environment Variable:
     TBC_API_KEY = YOUR_TBC_API_V2_KEY
4. Deploy.
5. Your Mini App URL can be:
     https://YOUR-APP.vercel.app/?bot_id=123456789

The API v2 endpoint used is:
  GET /v2/bots/{botid}/export-bot?format=json&include_data=true

The API key is kept on Vercel and is NEVER placed in index.html.

IMPORTANT:
- The official TBC API documentation documents botid as the path parameter.
- It documents export-bot with include_data=true.
- It does not document a username-to-botid lookup endpoint in the API page used here.
- Therefore use the TBC bot ID in ?bot_id=... .
- No database is used. Every page refresh calls TBC API v2 live.
