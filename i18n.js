// All on-screen text in German (default) and English.
// Use {placeholders} — filled in by app.js via the t() helper.
window.I18N = {
  de: {
    tagline: "Wir sammeln Erinnerungen",
    welcomeTitle: "Eure Fotos für {couple}",
    welcomeIntro:
      "Zur Hochzeit basteln wir eine kleine Foto-Überraschung für Judith und Sven – aus euren schönsten gemeinsamen Momenten. Lade ein bis sechs Lieblingsfotos hoch und teile die Erinnerungen dazu: so viel oder so wenig du möchtest, ganz wie du magst. Keine Anmeldung, dauert nur ein bis zwei Minuten – und hilft uns, den beiden etwas ganz Besonderes zu schenken.",
    deadlinePrefix: "Bitte bis",
    startBtn: "Los geht’s",

    nameTitle: "Wer bist du?",
    nameSub: "Damit Judith und Sven wissen, von wem die Fotos kommen.",
    nameLabel: "Dein Name",
    namePlaceholder: "Vor- und Nachname",
    emailLabel: "E-Mail (optional)",
    emailPlaceholder: "nur für eventuelle Rückfragen",
    nameRequired: "Bitte gib deinen Namen ein.",
    continueBtn: "Weiter",

    photoCounter: "Foto {n} von {total}",
    choosePhoto: "Foto auswählen",
    changePhoto: "Anderes Foto",
    removePhoto: "Entfernen",
    captionLabel: "Eine Zeile dazu (optional)",
    captionPlaceholder: "Wann, wo, warum?",
    processing: "Bild wird vorbereitet…",
    tooLarge: "Dieses Foto ist zu groß. Bitte wähle eine kleinere Version.",
    decodeError: "Dieses Foto konnte nicht gelesen werden. Bitte ein anderes wählen.",
    backBtn: "Zurück",
    skipBtn: "Überspringen",
    nextBtn: "Weiter",
    toReviewBtn: "Zur Übersicht",

    reviewTitle: "Fast geschafft!",
    reviewSub: "Prüfe deine Auswahl und schick sie ab.",
    reviewEmpty: "Du hast noch kein Foto ausgewählt. Geh zurück und füge mindestens eines hinzu.",
    fromLabel: "Von",
    editHint: "Tippe ein Foto an, um es zu ändern.",
    submitOne: "1 Foto senden",
    submitMany: "{n} Fotos senden",
    notConfigured: "Der Upload ist noch nicht eingerichtet. Bitte später nochmal versuchen.",

    uploadingTitle: "Wird hochgeladen…",
    uploadingProgress: "Foto {n} von {total}",
    uploadingWarn: "Bitte schließe das Fenster nicht.",
    uploadFailed: "{n} Foto(s) konnten nicht gesendet werden.",
    retryBtn: "Erneut versuchen",

    thanksTitle: "Dankeschön! 💛",
    thanksBody: "Deine Fotos sind angekommen. Judith und Sven werden sich riesig freuen.",
    againBtn: "Fotos für jemand anderen senden",
  },

  en: {
    tagline: "We’re collecting memories",
    welcomeTitle: "Your photos for {couple}",
    welcomeIntro:
      "For the wedding we’re putting together a little photo surprise for Judith and Sven — made of your favorite moments with them. Upload one to six photos and share the memories behind them: as much or as little as you like, totally up to you. No sign-up, just one or two minutes — and it helps us make them something really special.",
    deadlinePrefix: "Please by",
    startBtn: "Let’s go",

    nameTitle: "Who are you?",
    nameSub: "So Judith and Sven know whose photos these are.",
    nameLabel: "Your name",
    namePlaceholder: "First and last name",
    emailLabel: "Email (optional)",
    emailPlaceholder: "only if we need to ask something",
    nameRequired: "Please enter your name.",
    continueBtn: "Continue",

    photoCounter: "Photo {n} of {total}",
    choosePhoto: "Choose photo",
    changePhoto: "Change photo",
    removePhoto: "Remove",
    captionLabel: "A line about it (optional)",
    captionPlaceholder: "When, where, why?",
    processing: "Preparing image…",
    tooLarge: "This photo is too large. Please choose a smaller version.",
    decodeError: "This photo couldn’t be read. Please choose another one.",
    backBtn: "Back",
    skipBtn: "Skip",
    nextBtn: "Next",
    toReviewBtn: "Review",

    reviewTitle: "Almost done!",
    reviewSub: "Check your selection and send it off.",
    reviewEmpty: "You haven’t added any photos yet. Go back and add at least one.",
    fromLabel: "From",
    editHint: "Tap a photo to change it.",
    submitOne: "Send 1 photo",
    submitMany: "Send {n} photos",
    notConfigured: "Uploading isn’t set up yet. Please try again later.",

    uploadingTitle: "Uploading…",
    uploadingProgress: "Photo {n} of {total}",
    uploadingWarn: "Please don’t close this window.",
    uploadFailed: "{n} photo(s) couldn’t be sent.",
    retryBtn: "Try again",

    thanksTitle: "Thank you! 💛",
    thanksBody: "Your photos are in. Judith and Sven will be so happy.",
    againBtn: "Send photos for someone else",
  },
};

// The seven prompts. `prefix` is used in the saved filename so the Drive folder
// stays sorted and self-describing. Each is optional for the guest.
window.PROMPTS = [
  { key: "fav-judith",   prefix: "01-fav-judith",   de: "Dein Lieblingsfoto mit Judith",                              en: "Your favorite photo with Judith" },
  { key: "fav-sven",     prefix: "02-fav-sven",     de: "Dein Lieblingsfoto mit Sven",                                en: "Your favorite photo with Sven" },
  { key: "first-judith", prefix: "03-first-judith", de: "Dein erstes Foto mit Judith",                                en: "Your first photo with Judith" },
  { key: "first-sven",   prefix: "04-first-sven",   de: "Dein erstes Foto mit Sven",                                  en: "Your first photo with Sven" },
  { key: "couple",       prefix: "05-couple",       de: "Dein Lieblingsfoto von den beiden zusammen",                 en: "Your favorite photo of the two of them together" },
  { key: "wildcard",     prefix: "06-wildcard",     de: "Joker – ein Foto deiner Wahl",                               en: "Wildcard — any photo you’d like to share" },
];
