// Shared across every page. Talks to the Express backend on localhost:5000.
const API_BASE_URL = "https://event-management-platform-7exh.onrender.com/api";

// --- session storage (JWT + basic user info) ---------------------------
function getToken() { return localStorage.getItem('token'); }
function getRole() { return localStorage.getItem('role'); }
function getUserName() { return localStorage.getItem('name'); }

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('role', user.role);
  localStorage.setItem('name', user.name);
  localStorage.setItem('userId', user.id);
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  localStorage.removeItem('userId');
}

function logout() {
  clearSession();
  window.location.href = 'login.html';
}

// Call at the top of every protected admin page.
function requireAdmin() {
  if (!getToken() || getRole() !== 'admin') {
    window.location.href = 'login.html';
  }
}

// Call at the top of every protected participant page. Preserves the page
// the user was trying to reach (e.g. a QR check-in link) as ?returnTo=...
// so login.html can send them back after they sign in.
function requireParticipant() {
  if (!getToken() || getRole() !== 'participant') {
    window.location.href = `login.html?returnTo=${encodeURIComponent(window.location.href)}`;
  }
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// --- datetime helpers (sessions use plain DATETIME, no timezone) -------
// We never round-trip through Date.toISOString() for *writing* values,
// because that converts to UTC and would shift the displayed time if the
// browser's timezone offset != 0. Reading (new Date(str) + local getters)
// is fine because the backend and browser are on the same machine/timezone.

function toDatetimeLocalValue(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Converts a <input type="datetime-local"> value ("2026-10-02T11:00") into
// a plain "YYYY-MM-DD HH:MM:00" string MySQL DATETIME accepts, with no
// timezone conversion at all.
function toMySQLDatetime(localValue) {
  return localValue.replace('T', ' ') + ':00';
}

function stars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', hour12: true });
}

// --- 12-hour dropdown time picker (replaces native time scrollers) -----
// Call populateTimeSelects('foo') once the empty <select id="foo_hour">,
// <select id="foo_minute">, <select id="foo_ampm"> exist in the DOM.
function populateTimeSelects(prefix) {
  const hourSel = document.getElementById(`${prefix}_hour`);
  const minSel = document.getElementById(`${prefix}_minute`);
  const ampmSel = document.getElementById(`${prefix}_ampm`);
  hourSel.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1)
    .map(h => `<option value="${h}">${h}</option>`).join('');
  minSel.innerHTML = Array.from({ length: 60 }, (_, i) => i)
    .map(m => `<option value="${m}">${String(m).padStart(2, '0')}</option>`).join('');
  ampmSel.innerHTML = '<option value="AM">AM</option><option value="PM">PM</option>';
}

// Reads the three dropdowns back as a 24-hour "HH:MM" string.
function readTimeSelects(prefix) {
  let hour = Number(document.getElementById(`${prefix}_hour`).value);
  const minute = Number(document.getElementById(`${prefix}_minute`).value);
  const ampm = document.getElementById(`${prefix}_ampm`).value;
  if (ampm === 'AM') { if (hour === 12) hour = 0; }
  else if (hour !== 12) { hour += 12; }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// Pre-fills the three dropdowns from a 24-hour "HH:MM..." string (e.g. from the DB).
function setTimeSelects(prefix, hhmm) {
  if (!hhmm) return;
  const [hStr, mStr] = hhmm.slice(0, 5).split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  document.getElementById(`${prefix}_hour`).value = hour12;
  document.getElementById(`${prefix}_minute`).value = m;
  document.getElementById(`${prefix}_ampm`).value = ampm;
}

// --- QR check-in link helpers --------------------------------------------
// The admin's QR now encodes a full URL (not just the bare token) so that
// scanning it with a phone's camera app / Google Lens opens checkin.html
// directly, which logs the participant's attendance automatically.
function buildCheckinUrl(eventId, token) {
  const base = window.location.href.replace(/[^/]*$/, ''); // current folder, any page
  return `${base}checkin.html?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(token)}`;
}

// Pulls a token back out of either a scanned checkin URL or a bare token
// string, so the in-app scanner works with old-style raw-token QR codes too.
function extractTokenFromScan(scannedText) {
  try {
    const url = new URL(scannedText);
    const token = url.searchParams.get('token');
    if (token) return { token, eventId: url.searchParams.get('eventId') };
  } catch (e) {
    // Not a URL — treat the whole scanned string as the raw token.
  }
  return { token: scannedText.trim(), eventId: null };
}

// --- generic API call ---------------------------------------------------
// Throws an Error with the backend's own message on any non-2xx response,
// so callers can just try/catch and show err.message to the user.
async function apiRequest(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Is the backend running on localhost:5000?');
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body is fine */ }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}

// --- tiny UI helper used on every page for error/success banners -------
function showMessage(el, text, isError = true) {
  el.textContent = text;
  el.className = isError ? 'msg msg-error' : 'msg msg-success';
  el.style.display = text ? 'block' : 'none';
}
