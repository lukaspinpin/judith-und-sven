/**
 * Judith & Sven — photo collection backend (Google Apps Script)
 *
 * Receives one photo at a time from the web app, saves it into a Drive folder,
 * and logs a row in a Google Sheet. Runs as YOU (the owner), so guests need no
 * login. Deploy as a Web App: Execute as = Me, Who has access = Anyone.
 *
 * See SETUP.md for the click-by-click guide. Fill in the three values below.
 */

// ── FILL THESE IN ──────────────────────────────────────────────────────────
var FOLDER_ID = "PASTE_DRIVE_FOLDER_ID";   // the Drive folder that will hold the photos
var SHEET_ID  = "PASTE_SHEET_ID";          // the Google Sheet that logs submissions
var TOKEN     = "judith-sven-2026";        // must match `token` in config.js
// ───────────────────────────────────────────────────────────────────────────

/** Receives an upload from the web app. */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: "no body" });
    }
    var data = JSON.parse(e.postData.contents);

    if (data.token !== TOKEN) {
      return json({ ok: false, error: "bad token" });
    }
    if (!data.dataBase64 || !data.filename) {
      return json({ ok: false, error: "missing file" });
    }

    var folder = DriveApp.getFolderById(FOLDER_ID);
    var bytes = Utilities.base64Decode(data.dataBase64);
    var blob = Utilities.newBlob(bytes, data.mimeType || "image/jpeg", data.filename);
    var file = folder.createFile(blob);

    // Stash the human-readable context on the file too, so the Drive folder is
    // useful even without the sheet open.
    file.setDescription(
      [data.name, data.prompt, data.caption].filter(function (x) { return x; }).join("  |  ")
    );

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    sheet.appendRow([
      new Date(),
      data.name || "",
      data.email || "",
      data.lang || "",
      data.category || "",
      data.caption || "",
      data.filename || "",
      file.getUrl(),
    ]);

    return json({ ok: true, fileUrl: file.getUrl() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Health check — open the /exec URL in a browser to confirm it's live. */
function doGet() {
  return json({ ok: true, status: "alive" });
}

/** Run this ONCE from the editor to add the header row to your sheet. */
function setupSheet() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  sheet.getRange(1, 1, 1, 8).setValues([[
    "timestamp", "name", "email", "lang", "category", "caption", "filename", "driveUrl",
  ]]).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
