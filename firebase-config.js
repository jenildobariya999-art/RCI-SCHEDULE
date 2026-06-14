/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG — Paste your own Firebase project keys here
   ═══════════════════════════════════════════════════════════

   HOW TO GET THESE (takes 3 minutes, free):
   1. Go to https://console.firebase.google.com
   2. Click "Add project" → give it any name (e.g. "ca-board") → continue → continue → Create project
   3. Once inside the project, click the </> (Web) icon to add a web app
   4. Give it a nickname (e.g. "ca-board-web") → Register app
   5. You'll see a code block with "firebaseConfig = {...}" — copy those values below
   6. In the left sidebar: Build → Realtime Database → Create Database
      - Choose any location → Start in TEST MODE (allows read/write for now)
   7. Save this file, upload it to GitHub along with the other 4 HTML files

   ⚠️ Test mode rules expire after 30 days. Before that, go to
   Realtime Database → Rules tab and set:
   {
     "rules": { ".read": true, ".write": true }
   }
   (This keeps it open permanently — fine for a small private group.)
*/

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Initialize Firebase (compat SDK loaded via CDN in each HTML page)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
