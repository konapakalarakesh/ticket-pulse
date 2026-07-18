// ==UserScript==
// @name         Ticket Pulse Helper
// @namespace    ticket-pulse
// @version      1.0.0
// @description  Reads TT status off t.corp.amazon.com ticket pages and reports it back to an open Ticket Pulse dashboard tab. Runs entirely in your own authenticated browser session.
// @match        https://t.corp.amazon.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Auto-filled with the dashboard's origin at the time you downloaded this
  // file (https://konapakalarakesh.github.io). Only that origin can receive scraped ticket data.
  const TARGET_ORIGIN = 'https://konapakalarakesh.github.io';

  const m = location.pathname.match(/^\/([A-Z]?\d{6,}|[A-Z0-9-]{6,})\/?$/i);
  if (!m) return;
  const ticketId = m[1];

  function extractField(text, label) {
    const re = new RegExp(
      label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*\\n?\\s*([^\\n]+)',
      'i'
    );
    const found = text.match(re);
    return found ? found[1].trim() : '';
  }

  function scrapeAndReport(attempt) {
    attempt = attempt || 1;
    const bodyText = document.body ? document.body.innerText : '';
    if (!/Status\s*:?/i.test(bodyText) && attempt < 6) {
      setTimeout(() => scrapeAndReport(attempt + 1), 700);
      return;
    }
    const payload = {
      id: ticketId,
      status: extractField(bodyText, 'Status'),
      closureCode: extractField(bodyText, 'Closure code'),
      rootCause: extractField(bodyText, 'Root cause'),
      severity: extractField(bodyText, 'Severity'),
      priority: extractField(bodyText, 'Priority'),
      category: extractField(bodyText, 'Category'),
      group: extractField(bodyText, 'Group'),
    };
    if (!payload.status) return;
    if (window.opener) {
      window.opener.postMessage({ source: 'TICKET_PULSE_HELPER', payload }, TARGET_ORIGIN);
      showToast('✓ Synced to Ticket Pulse — ' + payload.status);
    }
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;background:#121826;color:#35E0C0;border:1px solid #232B3E;padding:10px 16px;border-radius:9px;font:600 12.5px -apple-system,Segoe UI,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  scrapeAndReport();
})();
