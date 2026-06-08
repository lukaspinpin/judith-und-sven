# Setup — connecting the app to Google Drive (≈ 5–10 minutes)

You only do this **once**, in the Google account that should own the photos
(probably yours, or a shared wedding account). Nothing here costs money.

The app sends each photo to a tiny Google Apps Script "web app" that runs as you
and saves files into a Drive folder + logs them in a Sheet. Guests never log in.

---

## 1. Create the Drive folder

1. Go to <https://drive.google.com> → **New ▸ Folder** → name it e.g.
   `Judith & Sven – Photos`.
2. Open the folder. Look at the browser address bar:
   `https://drive.google.com/drive/folders/`**`1AbC...XyZ`**
   Copy that long ID after `folders/` → this is your **FOLDER_ID**.

## 2. Create the logging Sheet

1. Go to <https://sheets.google.com> → **Blank spreadsheet** → name it
   `Judith & Sven – Submissions`.
2. From its address bar:
   `https://docs.google.com/spreadsheets/d/`**`1QrS...Tuv`**`/edit`
   Copy the ID between `/d/` and `/edit` → this is your **SHEET_ID**.

## 3. Create the Apps Script

1. Go to <https://script.google.com> → **New project**.
2. Delete the sample code, then open [`apps-script/Code.gs`](apps-script/Code.gs)
   from this project and paste its **entire** contents in.
3. At the top, fill in the three values:
   - `FOLDER_ID` → from step 1
   - `SHEET_ID` → from step 2
   - `TOKEN` → any word you like (default `judith-sven-2026`). **Remember it.**
4. Click **Save** (💾).
5. In the function dropdown choose **`setupSheet`** → click **Run**. Google will
   ask you to authorize — choose your account → *Advanced* → *Go to project
   (unsafe)* → *Allow*. (It says "unsafe" only because it's your own script.)
   This adds the header row to your Sheet.

## 4. Deploy it as a Web App

1. Click **Deploy ▸ New deployment**.
2. Click the gear ⚙ next to "Select type" → choose **Web app**.
3. Set:
   - **Description:** `wedding upload`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**   ← important (this means anonymous guests)
4. Click **Deploy** → authorize again if asked.
5. Copy the **Web app URL**. It ends in `/exec`, like
   `https://script.google.com/macros/s/AKfycb..../exec`.
6. Quick test: paste that URL into a browser. You should see
   `{"ok":true,"status":"alive"}`.

## 5. Plug it into the app

1. Open [`config.js`](config.js) and set:
   ```js
   uploadUrl: "https://script.google.com/macros/s/AKfycb..../exec",
   token: "judith-sven-2026",   // EXACTLY the same word as TOKEN in Code.gs
   ```
2. Also set the real `deadline` and (optional) the couple photo — see
   [`README.md`](README.md).
3. Save, then commit & push (or just re-run the deploy step you used).

## 6. Test end-to-end

Open the live site, upload one test photo → it should appear in your Drive
folder within a few seconds, with a new row in the Sheet. Delete the test photo
afterwards. Done! 🎉

---

### If you ever change `Code.gs`
Apps Script doesn't update a live web app automatically. Re-deploy:
**Deploy ▸ Manage deployments ▸ ✏️ Edit ▸ Version: New version ▸ Deploy.**
The `/exec` URL stays the same, so you don't need to touch `config.js`.

### Troubleshooting
- **Browser shows the script asking to log in** → "Who has access" isn't set to
  *Anyone*. Edit the deployment and fix it.
- **Photos don't arrive** → confirm `uploadUrl` ends in `/exec` and the `token`
  matches in both files.
- **`bad token`** → the word in `config.js` ≠ `TOKEN` in `Code.gs`.
