interface Lead {
  id: string;
  name: string;
  email: string;
  project: string;
  message: string;
  status: 'new' | 'contacted' | 'won' | 'lost';
  notes: string;
  created_at: string;
}

const STATUSES: Lead['status'][] = ['new', 'contacted', 'won', 'lost'];

const loginView = document.querySelector<HTMLElement>('[data-login]')!;
const dashView = document.querySelector<HTMLElement>('[data-dash]')!;
const loginForm = document.querySelector<HTMLFormElement>('[data-login-form]')!;
const loginErr = document.querySelector<HTMLElement>('[data-login-err]')!;
const leadsEl = document.querySelector<HTMLElement>('[data-leads]')!;
const statsEl = document.querySelector<HTMLElement>('[data-stats]')!;
const refreshBtn = document.querySelector<HTMLButtonElement>('[data-refresh]')!;
const logoutBtn = document.querySelector<HTMLButtonElement>('[data-logout]')!;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });

function showLogin() {
  loginView.hidden = false;
  dashView.hidden = true;
}

function showDash() {
  loginView.hidden = true;
  dashView.hidden = false;
}

function renderStats(leads: Lead[]) {
  const counts: Record<string, number> = { new: 0, contacted: 0, won: 0, lost: 0 };
  leads.forEach((l) => (counts[l.status] = (counts[l.status] ?? 0) + 1));
  statsEl.innerHTML =
    `<div class="stat"><strong>${leads.length}</strong><span>Total</span></div>` +
    STATUSES.map(
      (s) => `<div class="stat"><strong>${counts[s]}</strong><span>${s}</span></div>`
    ).join('');
}

function renderLeads(leads: Lead[]) {
  if (leads.length === 0) {
    leadsEl.innerHTML = '<p class="empty">No leads yet.</p>';
    return;
  }
  leadsEl.innerHTML = leads
    .map((l) => {
      const opts = STATUSES.map(
        (s) => `<option value="${s}"${s === l.status ? ' selected' : ''}>${s}</option>`
      ).join('');
      return `
        <article class="lead" data-id="${l.id}">
          <div class="lead-head">
            <div>
              <h3>${esc(l.name)} <span class="badge ${l.status}">${l.status}</span></h3>
              <a href="mailto:${esc(l.email)}">${esc(l.email)}</a>
              <div class="project">${esc(l.project)}</div>
              <div class="meta">${fmtDate(l.created_at)}</div>
            </div>
            <select data-status>${opts}</select>
          </div>
          <p class="message">${esc(l.message)}</p>
          <textarea data-notes placeholder="Private notes…">${esc(l.notes || '')}</textarea>
          <div class="controls">
            <button class="btn save-note" data-save>Save</button>
            <span class="saved-flash" data-flash></span>
          </div>
        </article>`;
    })
    .join('');

  leadsEl.querySelectorAll<HTMLElement>('.lead').forEach((card) => {
    const id = card.dataset.id!;
    const statusSel = card.querySelector<HTMLSelectElement>('[data-status]')!;
    const notesEl = card.querySelector<HTMLTextAreaElement>('[data-notes]')!;
    const saveBtn = card.querySelector<HTMLButtonElement>('[data-save]')!;
    const flash = card.querySelector<HTMLElement>('[data-flash]')!;
    const badge = card.querySelector<HTMLElement>('.badge')!;

    const save = async () => {
      saveBtn.disabled = true;
      const status = statusSel.value as Lead['status'];
      const ok = await updateLead(id, status, notesEl.value);
      saveBtn.disabled = false;
      if (ok) {
        badge.className = `badge ${status}`;
        badge.textContent = status;
        flash.textContent = 'Saved';
        setTimeout(() => (flash.textContent = ''), 1800);
      } else {
        flash.textContent = 'Failed';
      }
    };

    saveBtn.addEventListener('click', save);
    statusSel.addEventListener('change', save);
  });
}

async function loadLeads() {
  leadsEl.innerHTML = '<p class="loading">Loading leads…</p>';
  const res = await fetch('/api/admin/leads');
  if (res.status === 401) {
    showLogin();
    return;
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; leads?: Lead[] };
  if (!res.ok || !data.ok) {
    leadsEl.innerHTML = '<p class="empty">Could not load leads.</p>';
    return;
  }
  showDash();
  renderStats(data.leads ?? []);
  renderLeads(data.leads ?? []);
}

async function updateLead(id: string, status: Lead['status'], notes: string): Promise<boolean> {
  const res = await fetch('/api/admin/leads', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status, notes })
  });
  return res.ok;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErr.textContent = '';
  const password = new FormData(loginForm).get('password');
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) {
    loginForm.reset();
    await loadLeads();
  } else {
    loginErr.textContent = data.error || 'Login failed';
  }
});

refreshBtn.addEventListener('click', loadLeads);

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/leads', { method: 'DELETE' });
  showLogin();
});

// On load, try to fetch leads — if the cookie is valid we go straight to the
// dashboard, otherwise the 401 drops us to the login screen.
loadLeads();
