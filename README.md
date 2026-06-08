# Judith & Sven — Wedding Photo Collection 💛

A small bilingual (🇩🇪/🇬🇧) web app that asks friends & family a few specific
questions and collects **one curated photo + caption per prompt**, uploading each
straight into the couple's **Google Drive** (plus a logging Sheet). The prompts
keep submissions meaningful and stop people dumping hundreds of random photos.

The collected photos later feed a captioned slideshow / photo book.

## How it works

```
Guest's phone → this site (GitHub Pages) → Google Apps Script → Drive folder + Sheet
```

- **Frontend:** plain HTML/CSS/JS, no build step. Hosted free on GitHub Pages.
- **Backend:** a Google Apps Script web app that runs as the couple's account.
  Guests never log in and install nothing.

## The seven prompts

1. Favorite photo with Judith
2. Favorite photo with Sven
3. First photo with Judith
4. First photo with Sven
5. Favorite photo of the two of them together
6. A photo that captures a memory with either of them
7. Wildcard — any photo

Each prompt is optional ("skip what doesn't apply").

## One-time setup

See **[SETUP.md](SETUP.md)** — create a Drive folder + Sheet, paste the script,
deploy it, and paste the URL into `config.js`. ~5–10 minutes.

## Things you'll want to edit (`config.js`)

| Field          | What it does                                                        |
| -------------- | ------------------------------------------------------------------- |
| `deadline`     | The "please by …" date shown on the welcome screen (DE + EN).       |
| `couplePhoto`  | Landing photo. Drop a file in `assets/` and point here, e.g. `assets/couple.jpg`. |
| `uploadUrl`    | The Apps Script web-app URL (from SETUP.md).                        |
| `token`        | Anti-spam word; must match `TOKEN` in `apps-script/Code.gs`.        |

To change the **prompts** or **wording**, edit `i18n.js` (`PROMPTS` and the
German/English strings).

## Add the couple photo

Drop a landscape-ish photo into `assets/` (e.g. `couple.jpg`) and set
`couplePhoto: "assets/couple.jpg"` in `config.js`. Until then a placeholder shows.

## QR code for invitations

After the site is live, generate a QR code pointing to it:

```bash
npx --yes qrcode "https://USERNAME.github.io/REPO/" -o assets/qr.png
# or:
node scripts/make-qr.mjs "https://USERNAME.github.io/REPO/"
```

## Guest invitation message (copy–paste)

**Deutsch**
> 💛 **Foto-Überraschung für Judith & Sven**
> Wir sammeln eure schönsten Erinnerungen mit den beiden! Beantworte ein paar
> kleine Fragen und lade je ein Lieblingsfoto hoch – ganz ohne Anmeldung, in
> wenigen Minuten. Pro Frage ein Foto genügt.
> 👉 [LINK]  · Bitte bis [DATUM]. Danke! 🥂

**English**
> 💛 **A photo surprise for Judith & Sven**
> We're collecting everyone's favorite memories with the two of them! Answer a
> few quick prompts and upload one photo for each — no sign-up, just a couple of
> minutes. One photo per prompt is plenty.
> 👉 [LINK]  · Please by [DATE]. Thank you! 🥂

## Local preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Privacy

The repo is public (so GitHub Pages is free) but contains **no secrets** — the
Apps Script URL is a public endpoint by design, and the photos live only in the
couple's private Drive. The `token` is light spam protection, not a password.

---
🤖 Built with [Claude Code](https://claude.com/claude-code)
