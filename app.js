/* ─────────────────────────────────────────────────────────────────────────
   Judith & Sven — photo collection app
   Vanilla JS, no build step. Screens are rendered into #stage.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var CONFIG = window.CONFIG;
  var I18N = window.I18N;
  var PROMPTS = window.PROMPTS;

  // Keep base64 payloads comfortably under the Apps Script 50 MB blob cap
  // (base64 adds ~33%, so ~30 MB binary → ~40 MB encoded).
  var SAFE_MAX_BYTES = 30 * 1024 * 1024;

  var state = {
    lang: "de", // German first (toggle to EN)
    name: "",
    email: "",
    idx: 0,
    screen: "welcome",
    photos: {}, // key -> { previewUrl, dataBase64, mimeType, ext, caption }
    uploading: false,
    nameError: false,
  };

  var stage = document.getElementById("stage");
  var langToggle = document.getElementById("langToggle");

  // ─── helpers ──────────────────────────────────────────────────────────────
  function t(key, vars) {
    var s = (I18N[state.lang] && I18N[state.lang][key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace("{" + k + "}", vars[k]);
      });
    }
    return s;
  }
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function slugify(str) {
    return String(str || "guest")
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")  // strip accents
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      .slice(0, 40) || "guest";
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function selectedEntries() {
    return PROMPTS.filter(function (p) { return state.photos[p.key]; });
  }

  // ─── image handling ─────────────────────────────────────────────────────
  function fileToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var res = String(fr.result);
        var i = res.indexOf(",");
        resolve(i >= 0 ? res.slice(i + 1) : res);
      };
      fr.onerror = function () { reject(fr.error || new Error("read")); };
      fr.readAsDataURL(blob);
    });
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  // Re-encode to JPEG, downscaling only as much as needed to fit under maxBytes.
  function canvasReencode(file, maxBytes) {
    return loadImage(file).then(function (r) {
      var img = r.img, previewUrl = r.url;
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      var scale = 1;
      function attempt(n) {
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
        return new Promise(function (resolve) {
          canvas.toBlob(function (blob) {
            if ((blob && blob.size <= maxBytes) || n >= 7) {
              resolve({ blob: blob, previewUrl: previewUrl });
            } else {
              scale *= 0.8;
              resolve(attempt(n + 1));
            }
          }, "image/jpeg", 0.92);
        });
      }
      return attempt(0);
    });
  }

  // Returns { dataBase64, mimeType, ext, previewUrl }
  function processImage(file) {
    var webFriendly = /^image\/(jpeg|png|webp|gif)$/i.test(file.type);
    // Best quality: keep the original bytes untouched when they're web-friendly
    // and not too big — no recompression.
    if (webFriendly && file.size <= SAFE_MAX_BYTES) {
      return fileToBase64(file).then(function (b64) {
        return {
          dataBase64: b64,
          mimeType: file.type,
          ext: extFromType(file.type),
          previewUrl: URL.createObjectURL(file),
        };
      });
    }
    // Otherwise (HEIC / unknown / oversized): re-encode + downscale via canvas.
    return canvasReencode(file, SAFE_MAX_BYTES).then(function (r) {
      return fileToBase64(r.blob).then(function (b64) {
        return { dataBase64: b64, mimeType: "image/jpeg", ext: "jpg", previewUrl: r.previewUrl };
      });
    }).catch(function () {
      // Canvas couldn't decode (e.g. HEIC in a non-Safari browser).
      // If the original is small enough, upload its raw bytes as-is.
      if (file.size <= SAFE_MAX_BYTES) {
        return fileToBase64(file).then(function (b64) {
          return {
            dataBase64: b64,
            mimeType: file.type || "application/octet-stream",
            ext: extFromName(file.name) || "jpg",
            previewUrl: URL.createObjectURL(file),
          };
        });
      }
      throw new Error("too-large");
    });
  }

  function extFromType(type) {
    if (/jpeg/.test(type)) return "jpg";
    if (/png/.test(type)) return "png";
    if (/webp/.test(type)) return "webp";
    if (/gif/.test(type)) return "gif";
    return "jpg";
  }
  function extFromName(name) {
    var m = /\.([a-z0-9]+)$/i.exec(name || "");
    return m ? m[1].toLowerCase() : "";
  }

  // ─── upload ───────────────────────────────────────────────────────────────
  function uploadOne(payload, attempts) {
    attempts = attempts || 3;
    var lastErr;
    function go(i) {
      // Simple request (no custom headers, text/plain body) → no CORS preflight.
      return fetch(CONFIG.uploadUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        redirect: "follow",
      })
        .then(function (res) { return res.text(); })
        .then(function (text) {
          var json;
          try { json = JSON.parse(text); } catch (e) { throw new Error("Unexpected response"); }
          if (!json.ok) throw new Error(json.error || "Upload failed");
          return json;
        })
        .catch(function (err) {
          lastErr = err;
          if (i + 1 < attempts) {
            return sleep(700 * (i + 1)).then(function () { return go(i + 1); });
          }
          throw lastErr;
        });
    }
    return go(0);
  }

  // ─── render ────────────────────────────────────────────────────────────────
  function show(screen) { state.screen = screen; render(); }

  function render() {
    document.documentElement.lang = state.lang;
    langToggle.textContent = state.lang === "de" ? "EN" : "DE";
    switch (state.screen) {
      case "welcome": return renderWelcome();
      case "name": return renderName();
      case "prompt": return renderPrompt();
      case "review": return renderReview();
      case "uploading": return renderUploading();
      case "thanks": return renderThanks();
    }
  }

  function renderWelcome() {
    stage.innerHTML =
      '<div class="card center">' +
        '<img class="hero" src="' + esc(CONFIG.couplePhoto) + '" alt="Judith & Sven" ' +
          'onerror="this.onerror=null;this.src=\'assets/couple-placeholder.svg\'">' +
        '<p class="kicker">' + esc(t("tagline")) + "</p>" +
        "<h1>" + esc(t("welcomeTitle", { couple: CONFIG.coupleNames })) + "</h1>" +
        (CONFIG.event ? '<p class="event-line">' + esc(CONFIG.event.date[state.lang]) +
          " · " + esc(CONFIG.event.venue) + "</p>" : "") +
        '<p class="muted">' + esc(t("welcomeIntro")) + "</p>" +
        '<span class="rule">' + esc(t("welcomeRule")) + "</span>" +
        '<p class="deadline">' + esc(t("deadlinePrefix")) + " <strong>" +
          esc(CONFIG.deadline[state.lang]) + "</strong></p>" +
        '<button class="btn btn-primary" id="startBtn">' + esc(t("startBtn")) + "</button>" +
      "</div>";
    document.getElementById("startBtn").onclick = function () { show("name"); };
  }

  function renderName() {
    stage.innerHTML =
      '<div class="card">' +
        "<h2>" + esc(t("nameTitle")) + "</h2>" +
        '<p class="muted">' + esc(t("nameSub")) + "</p>" +
        '<label class="field"><span class="field-label">' + esc(t("nameLabel")) + "</span>" +
          '<input type="text" id="nameInput" autocomplete="name" value="' + esc(state.name) + '" ' +
            'placeholder="' + esc(t("namePlaceholder")) + '"></label>' +
        '<div class="error" id="nameErr">' + (state.nameError ? esc(t("nameRequired")) : "") + "</div>" +
        '<label class="field"><span class="field-label">' + esc(t("emailLabel")) + "</span>" +
          '<input type="email" id="emailInput" autocomplete="email" value="' + esc(state.email) + '" ' +
            'placeholder="' + esc(t("emailPlaceholder")) + '"></label>' +
        '<div class="btn-row">' +
          '<button class="btn btn-ghost" id="backBtn">' + esc(t("backBtn")) + "</button>" +
          '<button class="btn btn-primary" id="contBtn">' + esc(t("continueBtn")) + "</button>" +
        "</div>" +
      "</div>";
    var nameInput = document.getElementById("nameInput");
    var emailInput = document.getElementById("emailInput");
    nameInput.oninput = function () { state.name = nameInput.value; };
    emailInput.oninput = function () { state.email = emailInput.value; };
    document.getElementById("backBtn").onclick = function () { show("welcome"); };
    document.getElementById("contBtn").onclick = function () {
      if (!state.name.trim()) {
        state.nameError = true;
        document.getElementById("nameErr").textContent = t("nameRequired");
        nameInput.focus();
        return;
      }
      state.nameError = false;
      state.idx = 0;
      show("prompt");
    };
  }

  function renderPrompt() {
    var p = PROMPTS[state.idx];
    var total = PROMPTS.length;
    var photo = state.photos[p.key];
    var isLast = state.idx === total - 1;

    var dots = PROMPTS.map(function (pp, i) {
      var cls = "dot";
      if (state.photos[pp.key]) cls += " filled";
      if (i === state.idx) cls += " current";
      return '<span class="' + cls + '"></span>';
    }).join("");

    var picker = photo
      ? '<div class="preview-wrap">' +
          '<img class="preview" src="' + esc(photo.previewUrl) + '" alt="">' +
          '<div class="preview-actions">' +
            '<button class="btn btn-ghost" id="changeBtn">' + esc(t("changePhoto")) + "</button>" +
            '<button class="btn btn-ghost" id="removeBtn">' + esc(t("removePhoto")) + "</button>" +
          "</div>" +
        "</div>" +
        '<label class="field caption-field"><span class="field-label">' + esc(t("captionLabel")) + "</span>" +
          '<textarea id="capInput" rows="2" placeholder="' + esc(t("captionPlaceholder")) + '">' +
            esc(photo.caption || "") + "</textarea></label>"
      : '<div class="dropzone" id="dropzone"><span class="icon">📷</span>' + esc(t("choosePhoto")) + "</div>";

    var rightLabel = isLast ? t("toReviewBtn") : (photo ? t("nextBtn") : t("skipBtn"));

    stage.innerHTML =
      '<div class="card">' +
        '<div class="progress-dots">' + dots + "</div>" +
        '<div class="counter">' + esc(t("photoCounter", { n: state.idx + 1, total: total })) + "</div>" +
        '<p class="prompt-text">' + esc(p[state.lang]) + "</p>" +
        '<input type="file" id="fileInput" accept="image/*" style="display:none">' +
        '<div id="pickerArea">' + picker + "</div>" +
        '<div class="btn-row">' +
          '<button class="btn btn-ghost" id="prevBtn">' + esc(t("backBtn")) + "</button>" +
          '<button class="btn btn-primary" id="nextBtn">' + esc(rightLabel) + "</button>" +
        "</div>" +
      "</div>";

    var fileInput = document.getElementById("fileInput");
    fileInput.onchange = function () {
      var file = fileInput.files && fileInput.files[0];
      if (file) handleFile(p.key, file);
    };
    var dz = document.getElementById("dropzone");
    if (dz) dz.onclick = function () { fileInput.click(); };
    var changeBtn = document.getElementById("changeBtn");
    if (changeBtn) changeBtn.onclick = function () { fileInput.click(); };
    var removeBtn = document.getElementById("removeBtn");
    if (removeBtn) removeBtn.onclick = function () {
      if (photo && photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      delete state.photos[p.key];
      renderPrompt();
    };
    var capInput = document.getElementById("capInput");
    if (capInput) capInput.oninput = function () {
      if (state.photos[p.key]) state.photos[p.key].caption = capInput.value;
    };

    document.getElementById("prevBtn").onclick = function () {
      if (state.idx > 0) { state.idx--; renderPrompt(); }
      else show("name");
    };
    document.getElementById("nextBtn").onclick = function () {
      if (isLast) show("review");
      else { state.idx++; renderPrompt(); }
    };
  }

  function handleFile(key, file) {
    var area = document.getElementById("pickerArea");
    if (area) area.innerHTML = '<div class="processing"><div class="spinner"></div>' + esc(t("processing")) + "</div>";
    processImage(file).then(function (result) {
      var prev = state.photos[key];
      if (prev && prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      state.photos[key] = {
        previewUrl: result.previewUrl,
        dataBase64: result.dataBase64,
        mimeType: result.mimeType,
        ext: result.ext,
        caption: prev ? prev.caption : "",
      };
      renderPrompt();
    }).catch(function (err) {
      var msg = err && err.message === "too-large" ? t("tooLarge") : t("decodeError");
      if (area) area.innerHTML =
        '<div class="dropzone" id="dropzone"><span class="icon">📷</span>' + esc(t("choosePhoto")) + "</div>" +
        '<div class="error" style="margin-top:10px">' + esc(msg) + "</div>";
      var dz = document.getElementById("dropzone");
      var fileInput = document.getElementById("fileInput");
      if (dz && fileInput) dz.onclick = function () { fileInput.click(); };
    });
  }

  function renderReview() {
    var entries = selectedEntries();
    var inner;
    if (entries.length === 0) {
      inner =
        "<h2>" + esc(t("reviewTitle")) + "</h2>" +
        '<p class="muted">' + esc(t("reviewEmpty")) + "</p>" +
        '<div class="btn-row"><button class="btn btn-primary" id="backBtn">' + esc(t("backBtn")) + "</button></div>";
    } else {
      var tiles = entries.map(function (p) {
        var ph = state.photos[p.key];
        return '<div class="tile" data-key="' + esc(p.key) + '">' +
          '<button class="tile-remove" data-remove="' + esc(p.key) + '" aria-label="remove">×</button>' +
          '<img src="' + esc(ph.previewUrl) + '" alt="">' +
          '<div class="tile-body">' +
            '<div class="tile-label">' + esc(p[state.lang]) + "</div>" +
            (ph.caption ? '<div class="tile-cap">' + esc(ph.caption) + "</div>" : "") +
          "</div></div>";
      }).join("");
      var submitLabel = entries.length === 1 ? t("submitOne") : t("submitMany", { n: entries.length });
      inner =
        "<h2>" + esc(t("reviewTitle")) + "</h2>" +
        '<p class="muted">' + esc(t("reviewSub")) + "</p>" +
        '<p class="from-line">' + esc(t("fromLabel")) + " <strong>" + esc(state.name) + "</strong></p>" +
        '<div class="review-grid">' + tiles + "</div>" +
        '<p class="muted" style="font-size:13px;text-align:center">' + esc(t("editHint")) + "</p>" +
        '<div class="error" id="submitErr"></div>' +
        '<button class="btn btn-primary" id="submitBtn">' + esc(submitLabel) + "</button>" +
        '<div class="btn-row" style="margin-top:10px">' +
          '<button class="btn btn-ghost" id="backBtn">' + esc(t("backBtn")) + "</button>" +
        "</div>";
    }
    stage.innerHTML = '<div class="card">' + inner + "</div>";

    var backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.onclick = function () { state.idx = PROMPTS.length - 1; show("prompt"); };

    Array.prototype.forEach.call(stage.querySelectorAll(".tile"), function (tile) {
      tile.onclick = function (e) {
        if (e.target && e.target.getAttribute("data-remove")) return; // handled below
        var key = tile.getAttribute("data-key");
        var i = PROMPTS.findIndex(function (p) { return p.key === key; });
        if (i >= 0) { state.idx = i; show("prompt"); }
      };
    });
    Array.prototype.forEach.call(stage.querySelectorAll("[data-remove]"), function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var key = btn.getAttribute("data-remove");
        var ph = state.photos[key];
        if (ph && ph.previewUrl) URL.revokeObjectURL(ph.previewUrl);
        delete state.photos[key];
        renderReview();
      };
    });
    var submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.onclick = startUpload;
  }

  // ─── submit flow ────────────────────────────────────────────────────────
  var failedKeys = [];

  function startUpload() {
    if (state.uploading) return;
    if (!CONFIG.uploadUrl) {
      var err = document.getElementById("submitErr");
      if (err) err.textContent = t("notConfigured");
      return;
    }
    var entries = selectedEntries();
    if (entries.length === 0) return;
    state.uploading = true;
    failedKeys = [];
    show("uploading");
    runUploads(entries, 0);
  }

  function runUploads(entries, doneCount) {
    var total = entries.length;
    var slug = slugify(state.name);

    function next(i) {
      if (i >= entries.length) {
        state.uploading = false;
        if (failedKeys.length > 0) return renderUploadFailed(total - failedKeys.length, total);
        return show("thanks");
      }
      var p = entries[i];
      var ph = state.photos[p.key];
      updateProgress(doneCount + i + 1, total);
      var payload = {
        token: CONFIG.token,
        name: state.name,
        email: state.email,
        lang: state.lang,
        category: p.key,
        prompt: p.en,
        caption: ph.caption || "",
        filename: p.prefix + "__" + slug + "__1." + ph.ext,
        mimeType: ph.mimeType,
        dataBase64: ph.dataBase64,
      };
      return uploadOne(payload)
        .then(function () { return next(i + 1); })
        .catch(function () { failedKeys.push(p.key); return next(i + 1); });
    }
    next(0);
  }

  function updateProgress(n, total) {
    var fill = document.getElementById("barFill");
    var label = document.getElementById("upLabel");
    if (fill) fill.style.width = Math.round((n / total) * 100) + "%";
    if (label) label.textContent = t("uploadingProgress", { n: Math.min(n, total), total: total });
  }

  function renderUploading() {
    stage.innerHTML =
      '<div class="card center">' +
        '<div class="big-emoji">📤</div>' +
        "<h2>" + esc(t("uploadingTitle")) + "</h2>" +
        '<div class="bar"><span id="barFill"></span></div>' +
        '<p class="muted" id="upLabel">' + esc(t("uploadingProgress", { n: 1, total: selectedEntries().length })) + "</p>" +
        '<p class="muted" style="font-size:13px">' + esc(t("uploadingWarn")) + "</p>" +
      "</div>";
  }

  function renderUploadFailed(ok, total) {
    stage.innerHTML =
      '<div class="card center">' +
        '<div class="big-emoji">⚠️</div>' +
        "<h2>" + esc(t("uploadingTitle")) + "</h2>" +
        '<p class="muted">' + esc(t("uploadFailed", { n: failedKeys.length })) + "</p>" +
        '<button class="btn btn-primary" id="retryBtn">' + esc(t("retryBtn")) + "</button>" +
      "</div>";
    document.getElementById("retryBtn").onclick = function () {
      var retry = failedKeys.map(function (k) {
        return PROMPTS.find(function (p) { return p.key === k; });
      });
      failedKeys = [];
      state.uploading = true;
      show("uploading");
      runUploads(retry, 0);
    };
  }

  function renderThanks() {
    stage.innerHTML =
      '<div class="card center">' +
        '<div class="big-emoji">🎉</div>' +
        "<h1>" + esc(t("thanksTitle")) + "</h1>" +
        '<p class="muted">' + esc(t("thanksBody")) + "</p>" +
        '<button class="btn btn-ghost" id="againBtn">' + esc(t("againBtn")) + "</button>" +
      "</div>";
    document.getElementById("againBtn").onclick = function () {
      // Reset for a new person, keep language.
      Object.keys(state.photos).forEach(function (k) {
        var ph = state.photos[k];
        if (ph && ph.previewUrl) URL.revokeObjectURL(ph.previewUrl);
      });
      state.name = ""; state.email = ""; state.idx = 0; state.photos = {}; state.nameError = false;
      show("name");
    };
  }

  // ─── language toggle ──────────────────────────────────────────────────────
  langToggle.onclick = function () {
    state.lang = state.lang === "de" ? "en" : "de";
    render();
  };

  // Warn before closing mid-upload.
  window.addEventListener("beforeunload", function (e) {
    if (state.uploading) { e.preventDefault(); e.returnValue = ""; }
  });

  render();
})();
