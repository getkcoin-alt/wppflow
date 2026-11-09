/*! Scriwo OTP widget. One script, one call:  ScriwoOTP.verify({ key: "otp_pk_live_...", onVerified: function (r) { ... } })
 *  It asks for a phone number (or uses the one you pass), sends a code on WhatsApp, checks it, and hands your page a proof that your
 *  server confirms with POST /api/otp/proof/verify. No dependencies; its styles live in a shadow root, so your page cannot break it.
 */
(function () {
  "use strict";
  if (window.ScriwoOTP && window.ScriwoOTP.verify) return;
  var here = document.currentScript || document.querySelector('script[src*="/otp.js"]');
  var HOME = here && here.src ? new URL(here.src, location.href).origin : location.origin;

  var T = {
    en: { title: "Verify your phone", phoneLabel: "Your WhatsApp number", phoneHint: "We send a code on WhatsApp.", send: "Send code", sentTo: "We sent a code on WhatsApp to", codeLabel: "Code", verify: "Verify", resend: "Send again", resendIn: "Send again in {n}s", close: "Close", verified: "Phone verified", wrong: "That is not the code.", triesLeft: "{n} tries left.", expired: "That code expired. Send a new one.", locked: "Too many wrong tries. Send a new code.", used: "That code was already used.", superseded: "A newer code was sent. Use that one.", test: "Test mode: the code is 123456 and nothing is sent.", needCountry: "Add the country code, for example +971 50 123 4567.", wait: "Please wait…", error: "Something went wrong. Try again.", change: "Change number", noWhatsApp: "This number is not on WhatsApp.", tooMany: "Too many requests. Try again later.", off: "Verification is not available right now.", soon: "A code was just sent. You can ask again in a moment." },
    hi: { title: "अपना फ़ोन सत्यापित करें", phoneLabel: "आपका WhatsApp नंबर", phoneHint: "हम WhatsApp पर एक कोड भेजेंगे।", send: "कोड भेजें", sentTo: "हमने WhatsApp पर कोड भेजा है:", codeLabel: "कोड", verify: "सत्यापित करें", resend: "फिर से भेजें", resendIn: "{n} सेकंड में फिर से भेजें", close: "बंद करें", verified: "फ़ोन सत्यापित हो गया", wrong: "यह कोड सही नहीं है।", triesLeft: "{n} कोशिशें बाकी हैं।", expired: "यह कोड समाप्त हो गया। नया कोड भेजें।", locked: "बहुत ज़्यादा गलत कोशिशें। नया कोड भेजें।", used: "यह कोड पहले ही इस्तेमाल हो चुका है।", superseded: "नया कोड भेजा जा चुका है। उसका इस्तेमाल करें।", test: "टेस्ट मोड: कोड 123456 है और कुछ भेजा नहीं जाता।", needCountry: "देश का कोड जोड़ें, जैसे +91 98765 43210।", wait: "कृपया प्रतीक्षा करें…", error: "कुछ गलत हो गया। फिर कोशिश करें।", change: "नंबर बदलें", noWhatsApp: "यह नंबर WhatsApp पर नहीं है।", tooMany: "बहुत ज़्यादा अनुरोध। बाद में कोशिश करें।", off: "सत्यापन अभी उपलब्ध नहीं है।", soon: "अभी-अभी एक कोड भेजा गया है। थोड़ी देर बाद फिर कोशिश करें।" },
    ar: { title: "تحقق من هاتفك", phoneLabel: "رقم واتساب الخاص بك", phoneHint: "سنرسل لك رمزاً عبر واتساب.", send: "إرسال الرمز", sentTo: "أرسلنا رمزاً عبر واتساب إلى", codeLabel: "الرمز", verify: "تحقق", resend: "إعادة الإرسال", resendIn: "إعادة الإرسال بعد {n} ثانية", close: "إغلاق", verified: "تم التحقق من الهاتف", wrong: "هذا ليس الرمز الصحيح.", triesLeft: "المحاولات المتبقية: {n}.", expired: "انتهت صلاحية الرمز. أرسل رمزاً جديداً.", locked: "محاولات خاطئة كثيرة. أرسل رمزاً جديداً.", used: "تم استخدام هذا الرمز من قبل.", superseded: "تم إرسال رمز أحدث. استخدمه.", test: "وضع الاختبار: الرمز هو 123456 ولا يتم إرسال شيء.", needCountry: "أضف رمز الدولة، مثل 971 50 123 4567+", wait: "يرجى الانتظار…", error: "حدث خطأ. حاول مرة أخرى.", change: "تغيير الرقم", noWhatsApp: "هذا الرقم غير مسجل في واتساب.", tooMany: "طلبات كثيرة جداً. حاول لاحقاً.", off: "التحقق غير متاح حالياً.", soon: "تم إرسال رمز للتو. يمكنك الطلب مرة أخرى بعد قليل." },
  };
  var DIAL = { AE: "971", IN: "91", SA: "966", QA: "974", KW: "965", OM: "968", BH: "973", PK: "92", BD: "880", LK: "94", NP: "977", EG: "20", JO: "962", LB: "961", TR: "90", GB: "44", US: "1", CA: "1", AU: "61", SG: "65", MY: "60", ID: "62", PH: "63", NG: "234", KE: "254", ZA: "27", DE: "49", FR: "33", IT: "39", ES: "34" };
  var CSS =
    ":host{all:initial}*{box-sizing:border-box}" +
    ".ov{--bg:#fff;--fg:#14211c;--mut:#5d6b65;--line:#d9e0dc;--soft:#f1f4f2;--brand:#0f6b53;--bad:#b3261e;--ok:#177a4d;position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(10,20,16,.55);font:16px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans','Noto Sans Devanagari','Noto Sans Arabic',Arial,sans-serif;color:var(--fg)}" +
    "@media (prefers-color-scheme:dark){.ov{--bg:#16211d;--fg:#eef3f0;--mut:#a3b1aa;--line:#2c3a34;--soft:#1f2c27;--brand:#2fae8a;--bad:#ff8a80;--ok:#5fd39a}}" +
    ".card{position:relative;width:min(92vw,400px);background:var(--bg);border-radius:22px;padding:26px 24px 22px;box-shadow:0 24px 70px rgba(0,0,0,.4)}" +
    "@media (max-width:480px){.ov{align-items:flex-end}.card{width:100%;border-radius:22px 22px 0 0;padding-bottom:max(22px,env(safe-area-inset-bottom))}}" +
    "h2{margin:0 0 4px;font-size:20px;font-weight:650}p{margin:0}.mut{color:var(--mut);font-size:14px}" +
    "label{display:block;margin:18px 0 6px;font-size:14px;font-weight:600}" +
    "input{width:100%;height:50px;border:1.5px solid var(--line);border-radius:14px;padding:0 14px;font:inherit;font-size:17px;color:var(--fg);background:var(--soft);outline:none}" +
    "input:focus{border-color:var(--brand);background:var(--bg)}input.code{text-align:center;font-size:24px;letter-spacing:.45em;font-variant-numeric:tabular-nums}" +
    "button{font:inherit;cursor:pointer}.go{width:100%;height:50px;margin-top:16px;border:0;border-radius:999px;background:var(--brand);color:#fff;font-weight:650;font-size:16px}" +
    ".go:disabled{opacity:.55;cursor:default}.link{border:0;background:none;color:var(--brand);font-weight:600;font-size:14px;padding:10px 4px;min-height:44px}.link:disabled{color:var(--mut);cursor:default}" +
    ".x{position:absolute;top:10px;inset-inline-end:10px;width:44px;height:44px;border:0;border-radius:50%;background:none;color:var(--mut);font-size:24px;line-height:1}" +
    ".x:hover{background:var(--soft)}.msg{margin-top:12px;font-size:14px;min-height:20px;color:var(--bad)}.msg.ok{color:var(--ok)}.row{display:flex;gap:6px;align-items:center;justify-content:space-between;flex-wrap:wrap}" +
    ".test{margin-top:12px;padding:8px 12px;border-radius:12px;background:var(--soft);font-size:13px;color:var(--mut)}" +
    ".done{display:grid;place-items:center;text-align:center;padding:14px 0 6px;gap:12px}.tick{width:64px;height:64px;border-radius:50%;background:var(--ok);display:grid;place-items:center;color:#fff;font-size:34px;line-height:1}" +
    "@media (prefers-reduced-motion:no-preference){.card{animation:up .22s ease-out}@keyframes up{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}}";

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined) return;
      if (k === "text") node.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function call(api, path, payload) {
    var init = payload ? { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) } : { method: "GET" };
    return fetch(api + "/api/otp/widget/" + path, Object.assign({ credentials: "omit" }, init)).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || "error"); e.code = j.code; e.fix = j.fix; e.retryAfter = j.retryAfter; throw e; }
        return j;
      });
    });
  }
  function typed(raw, country) {
    var s = String(raw || "").replace(/[\s().-]/g, "");
    if (s.charAt(0) === "+") return s;
    if (s.slice(0, 2) === "00") return "+" + s.slice(2);
    var dial = country && DIAL[String(country).toUpperCase()];
    return dial && /^\d{5,}$/.test(s) ? "+" + dial + s.replace(/^0+/, "") : s;
  }
  var open = null;

  function verify(opts) {
    if (!opts || typeof opts.key !== "string") throw new Error("ScriwoOTP.verify needs { key: 'otp_pk_...' }");
    if (open) open();
    return new Promise(function (resolve) {
      var api = (opts.api || HOME).replace(/\/$/, "");
      var cfg = null, lang = "en", s = { step: "loading", phone: opts.phone ? typed(opts.phone, opts.country) : "", id: "", msg: "", ok: false, busy: false, wait: 0, to: "" };
      var timer = null, finished = false, previous = document.activeElement;
      var host = el("div"), root = host.attachShadow({ mode: "open" });
      var ov = el("div", { class: "ov" }), card = el("div", { class: "card", role: "dialog", "aria-modal": "true", "aria-labelledby": "t" });
      try {
        var sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); root.adoptedStyleSheets = [sheet];
      } catch (e) { root.appendChild(el("style", { text: CSS })); }
      root.appendChild(ov); ov.appendChild(card);
      document.body.appendChild(host);
      var t = function (k, n) { return (T[lang][k] || T.en[k] || k).replace("{n}", n); };

      function close(result) {
        if (finished) return; finished = true; open = null;
        clearInterval(timer); document.removeEventListener("keydown", onKey, true); host.remove();
        if (previous && previous.focus) try { previous.focus(); } catch (e) { /* the page moved on */ }
        if (typeof opts.onClose === "function") opts.onClose({ verified: Boolean(result) });
        resolve(result || null);
      }
      open = function () { close(null); };
      function onKey(e) {
        if (e.key === "Escape") { e.stopPropagation(); close(null); return; }
        if (e.key !== "Tab") return;
        var f = card.querySelectorAll("button:not([disabled]),input,a[href]");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1], active = root.activeElement;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
      document.addEventListener("keydown", onKey, true);
      ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(null); });

      function why(e) {
        var m = { invalid_phone: t("needCountry"), not_on_whatsapp: t("noWhatsApp"), resend_too_soon: t("soon"), too_many_requests: t("tooMany"), rate_limited: t("tooMany"), quota_exceeded: t("off"), otp_paused: t("off"), otp_suspended: t("off"), otp_unavailable: t("off"), no_number_connected: t("off"), number_offline: t("off") };
        return m[e.code] || (e.message ? e.message + (e.fix ? " " + e.fix : "") : t("error"));
      }
      function tick() { if (s.wait > 0) { s.wait -= 1; var b = card.querySelector("[data-resend]"); if (b) { b.textContent = s.wait > 0 ? t("resendIn", s.wait) : t("resend"); b.disabled = s.wait > 0; } } }

      function render(focus) {
        card.textContent = "";
        card.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
        card.appendChild(el("button", { class: "x", type: "button", "aria-label": t("close"), text: "×", onclick: function () { close(null); } }));
        var msg = el("p", { class: "msg" + (s.ok ? " ok" : ""), role: s.ok ? "status" : "alert", text: s.msg });
        if (s.step === "loading") { card.appendChild(el("h2", { id: "t", text: t("wait") })); card.appendChild(msg); }
        else if (s.step === "fatal") { card.appendChild(el("h2", { id: "t", text: t("title") })); card.appendChild(msg); }
        else if (s.step === "phone") {
          card.appendChild(el("h2", { id: "t", text: t("title") }));
          card.appendChild(el("p", { class: "mut", text: cfg && cfg.brand ? cfg.brand + " · " + t("phoneHint") : t("phoneHint") }));
          var ph = el("input", { id: "p", type: "tel", inputmode: "tel", autocomplete: "tel", placeholder: "+971 50 123 4567", value: s.phone });
          ph.addEventListener("input", function () { s.phone = ph.value; });
          card.appendChild(el("label", { for: "p", text: t("phoneLabel") })); card.appendChild(ph);
          card.appendChild(msg);
          var go = el("button", { class: "go", type: "button", text: t("send"), onclick: function () { send(); } });
          card.appendChild(go);
          ph.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
          if (focus) setTimeout(function () { ph.focus(); }, 30);
        } else if (s.step === "code") {
          card.appendChild(el("h2", { id: "t", text: t("title") }));
          card.appendChild(el("p", { class: "mut", text: t("sentTo") + " " + (s.to || s.phone) }));
          var n = (cfg && cfg.codeLength) || 6;
          var c = el("input", { id: "c", class: "code", inputmode: "numeric", autocomplete: "one-time-code", maxlength: String(n), placeholder: "0".repeat(n), "aria-label": t("codeLabel"), dir: "ltr" });
          c.addEventListener("input", function () { c.value = c.value.replace(/\D/g, "").slice(0, n); if (c.value.length === n) check(c.value); });
          c.addEventListener("keydown", function (e) { if (e.key === "Enter" && c.value) check(c.value); });
          card.appendChild(el("label", { for: "c", text: t("codeLabel") })); card.appendChild(c); card.appendChild(msg);
          card.appendChild(el("button", { class: "go", type: "button", text: t("verify"), onclick: function () { if (c.value) check(c.value); } }));
          card.appendChild(el("div", { class: "row" }, [
            el("button", { class: "link", type: "button", "data-resend": "1", text: s.wait > 0 ? t("resendIn", s.wait) : t("resend"), disabled: s.wait > 0 ? "" : null, onclick: function () { send(); } }),
            opts.phone ? null : el("button", { class: "link", type: "button", text: t("change"), onclick: function () { s.step = "phone"; s.msg = ""; render(true); } }),
          ]));
          if (focus) setTimeout(function () { c.focus(); }, 30);
        } else if (s.step === "done") {
          card.appendChild(el("div", { class: "done" }, [
            el("div", { class: "tick", text: "✓" }),
            el("h2", { id: "t", text: t("verified") }),
          ]));
        }
        if (cfg && cfg.test && s.step !== "done") card.appendChild(el("p", { class: "test", text: t("test") }));
      }
      function fail(e) { s.busy = false; s.ok = false; s.msg = why(e); if (s.step === "loading") s.step = "fatal"; if (e.retryAfter && e.code === "resend_too_soon") s.wait = Math.min(300, e.retryAfter); render(false); }
      function send() {
        if (s.busy) return;
        var phone = typed(s.phone, opts.country);
        if (!/^\+\d{8,15}$/.test(phone)) { s.msg = t("needCountry"); render(true); return; }
        s.busy = true; s.msg = t("wait"); s.ok = true; render(false);
        call(api, "send", { key: opts.key, phone: phone, reference: opts.reference, locale: lang }).then(function (r) {
          s.busy = false; s.id = r.id; s.to = r.to; s.phone = phone; s.step = "code"; s.msg = ""; s.ok = false; s.wait = Math.min(300, r.resendAfter || 30);
          render(true);
        }).catch(fail);
      }
      function check(code) {
        if (s.busy) return;
        s.busy = true;
        call(api, "verify", { key: opts.key, id: s.id, code: code }).then(function (r) {
          s.busy = false;
          if (r.valid) {
            s.step = "done"; render(false);
            var result = { proof: r.proof, id: r.id, phone: s.phone };
            if (typeof opts.onVerified === "function") try { opts.onVerified(result); } catch (e) { console.error(e); }
            setTimeout(function () { close(result); }, 1300);
            return;
          }
          var reasons = { wrong_code: t("wrong") + (r.attemptsLeft != null ? " " + t("triesLeft", r.attemptsLeft) : ""), expired: t("expired"), too_many_attempts: t("locked"), already_used: t("used"), superseded: t("superseded") };
          s.ok = false; s.msg = reasons[r.reason] || t("wrong"); render(false);
          var box = card.querySelector("#c"); if (box) { box.value = ""; box.focus(); }
        }).catch(fail);
      }

      timer = setInterval(tick, 1000);
      render(false);
      call(api, "config?key=" + encodeURIComponent(opts.key)).then(function (c) {
        cfg = c; var wanted = opts.locale || c.locale || (navigator.language || "en").slice(0, 2);
        lang = T[wanted] ? wanted : "en";
        if (!c.available) { s.step = "fatal"; s.msg = t("off"); return render(false); }
        var known = opts.phone && /^\+\d{8,15}$/.test(s.phone);
        s.step = known ? "loading" : "phone"; render(true);
        if (known) send();
      }).catch(function (e) { s.step = "fatal"; s.msg = why(e); render(false); });
    });
  }
  window.ScriwoOTP = { verify: verify, close: function () { if (open) open(); }, version: "1" };
})();
