const fetchQuoteWithTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
};
// Interactive quote calculator for the Services page.
// Single source of truth for pricing — edit numbers here.

interface BaseOption {
  id: string;
  label: string;
  price: number;
  note: string;
  // Scoped individually rather than priced here (e.g. custom software builds).
  // The calculator shows "quoted on scope" instead of a rand estimate.
  custom?: boolean;
}
interface AddOn {
  id: string;
  label: string;
  price: number;
  percent?: boolean; // price is a % of the running once-off total (e.g. rush)
  // Priced per engagement rather than here (e.g. marketing retainers), so it
  // is listed on the request but left out of the estimate arithmetic.
  quoted?: boolean;
}
interface CarePlan {
  id: string;
  label: string;
  price: number; // monthly
  note: string;
  popular?: boolean;
}

const BASES: BaseOption[] = [
  { id: 'landing', label: 'Landing page', price: 2500, note: 'single-page site' },
  { id: 'business', label: 'Business website', price: 6500, note: 'up to 5 pages' },
  { id: 'ecommerce', label: 'Ecommerce / advanced', price: 12000, note: 'store, bookings, etc.' },
  { id: 'redesign', label: 'Website redesign', price: 4500, note: 'refresh an existing site' },
  { id: 'software', label: 'Custom software', price: 0, note: 'apps, tools, automation — any platform', custom: true }
];

const ADDONS: AddOn[] = [
  { id: 'extra-page', label: 'Extra page (each)', price: 650 },
  { id: 'hosting', label: 'Hosting & domain setup', price: 1200 },
  { id: 'photography', label: 'Photography / media', price: 850 },
  { id: 'homelab', label: 'Homelab / server setup', price: 3500 },
  { id: 'logo', label: 'Logo / brand basics', price: 1800 },
  { id: 'marketing', label: 'Digital marketing / SEO', price: 0, quoted: true },
  { id: 'rush', label: 'Rush delivery (1 week)', price: 25, percent: true }
];

const CARE_PLANS: CarePlan[] = [
  { id: 'none', label: 'No care plan', price: 0, note: '' },
  { id: 'lite', label: 'Care Lite', price: 350, note: 'hosting + backups + uptime' },
  { id: 'plus', label: 'Care Plus', price: 750, note: '+ content updates + priority support', popular: true },
  { id: 'pro', label: 'Care Pro', price: 1500, note: '+ monthly improvements + photo credit' }
];

const zar = (n: number) => `R${n.toLocaleString('en-ZA')}`;

interface QuoteState {
  base: string;
  addons: Set<string>;
  extraPages: number;
  care: string;
}

function computeTotals(state: QuoteState) {
  const base = BASES.find((b) => b.id === state.base);
  // Custom software is scoped per project, so no once-off figure is shown.
  const custom = Boolean(base?.custom);
  let onceOff = base ? base.price : 0;

  // Flat add-ons first.
  for (const addon of ADDONS) {
    if (addon.percent || addon.quoted) continue;
    if (addon.id === 'extra-page') {
      onceOff += addon.price * state.extraPages;
    } else if (state.addons.has(addon.id)) {
      onceOff += addon.price;
    }
  }
  // Percentage add-ons (e.g. rush) apply to the running once-off total.
  for (const addon of ADDONS) {
    if (addon.quoted) continue;
    if (addon.percent && state.addons.has(addon.id)) {
      onceOff += Math.round((onceOff * addon.price) / 100);
    }
  }

  const carePlan = CARE_PLANS.find((c) => c.id === state.care);
  const monthly = carePlan ? carePlan.price : 0;

  // Selected extras that carry no figure here — surfaced so the visitor can
  // see they were included in the request, not silently dropped.
  const quotedExtras = ADDONS.filter((a) => a.quoted && state.addons.has(a.id)).map((a) => a.label);

  return { onceOff, monthly, custom, quotedExtras };
}

function buildSummary(state: QuoteState): string {
  const base = BASES.find((b) => b.id === state.base);
  const lines: string[] = [];
  if (base) lines.push(`Base: ${base.label}`);
  if (state.extraPages > 0) lines.push(`Extra pages: ${state.extraPages}`);
  for (const addon of ADDONS) {
    if (addon.id === 'extra-page') continue;
    if (state.addons.has(addon.id)) {
      lines.push(`Add-on: ${addon.label}${addon.quoted ? ' (quoted separately)' : ''}`);
    }
  }
  const care = CARE_PLANS.find((c) => c.id === state.care);
  if (care && care.id !== 'none') lines.push(`Care plan: ${care.label} (${zar(care.price)}/mo)`);
  const { onceOff, monthly, custom } = computeTotals(state);
  if (custom) {
    lines.push('Estimated once-off: quoted on scope (custom software build)');
  } else {
    lines.push(`Estimated once-off: ${zar(onceOff)}`);
  }
  if (monthly > 0) lines.push(`Estimated monthly: ${zar(monthly)}/mo`);
  return lines.join('\n');
}

export function initQuoteCalculator() {
  const root = document.querySelector<HTMLElement>('[data-quote]');
  if (!root) return;

  const state: QuoteState = {
    base: 'business',
    addons: new Set(),
    extraPages: 0,
    care: 'none'
  };

  // Render controls.
  root.innerHTML = `
    <div class="quote-grid">
      <div class="quote-col">
        <h3>1. Choose your base</h3>
        <div class="quote-options" data-bases>
          ${BASES.map(
            (b) => `
            <label class="quote-opt${b.id === state.base ? ' selected' : ''}">
              <input type="radio" name="base" value="${b.id}"${b.id === state.base ? ' checked' : ''} />
              <span class="quote-opt-label">${b.label}</span>
              <span class="quote-opt-note">${b.note}</span>
              <span class="quote-opt-price">${b.custom ? 'quoted on scope' : `from ${zar(b.price)}`}</span>
            </label>`
          ).join('')}
        </div>

        <h3>2. Add-ons</h3>
        <div class="quote-extra-pages">
          <span>Extra pages</span>
          <div class="stepper">
            <button type="button" data-pages-minus aria-label="Fewer pages">−</button>
            <span data-pages-count>0</span>
            <button type="button" data-pages-plus aria-label="More pages">+</button>
          </div>
          <span class="quote-opt-price">+${zar(650)} each</span>
        </div>
        <div class="quote-options" data-addons>
          ${ADDONS.filter((a) => a.id !== 'extra-page')
            .map(
              (a) => `
            <label class="quote-opt quote-check">
              <input type="checkbox" value="${a.id}" />
              <span class="quote-opt-label">${a.label}</span>
              <span class="quote-opt-price">${a.percent ? `+${a.price}%` : a.quoted ? 'quoted separately' : `+${zar(a.price)}`}</span>
            </label>`
            )
            .join('')}
        </div>

        <h3>3. Monthly care (optional)</h3>
        <div class="quote-options" data-care>
          ${CARE_PLANS.map(
            (c) => `
            <label class="quote-opt${c.id === state.care ? ' selected' : ''}${c.popular ? ' popular' : ''}">
              ${c.popular ? '<span class="quote-opt-badge">Most popular</span>' : ''}
              <input type="radio" name="care" value="${c.id}"${c.id === state.care ? ' checked' : ''} />
              <span class="quote-opt-label">${c.label}</span>
              ${c.note ? `<span class="quote-opt-note">${c.note}</span>` : ''}
              <span class="quote-opt-price">${c.price > 0 ? `${zar(c.price)}/mo` : '—'}</span>
            </label>`
          ).join('')}
        </div>
      </div>

      <aside class="quote-summary">
        <p class="eyebrow">Your estimate <span></span></p>
        <div class="quote-total" data-total></div>
        <p class="quote-disclaimer">An estimate to start the conversation — final quote confirmed after we discuss the details. No obligation, and we reply within 24 hours.</p>
        <form class="quote-form" data-quote-form>
          <label>Name <input type="text" name="name" autocomplete="name" maxlength="120" required /></label>
          <label>Email <input type="email" name="email" autocomplete="email" maxlength="200" required /></label>
          <label class="quote-brief" data-quote-brief hidden>What should the software do? <textarea name="brief" rows="3" maxlength="2000" placeholder="e.g. a booking system for my salon, an internal stock dashboard, an app for my delivery drivers"></textarea></label>
          <div class="hp-field" aria-hidden="true"><label>Company <input type="text" name="company" tabindex="-1" autocomplete="off" /></label></div>
          <button class="button button-primary" type="submit">Get my detailed quote <span aria-hidden="true">-&gt;</span></button>
          <p class="form-status" role="status" data-quote-status></p>
        </form>
      </aside>
    </div>`;

  const totalEl = root.querySelector<HTMLElement>('[data-total]')!;
  const pagesCount = root.querySelector<HTMLElement>('[data-pages-count]')!;
  const briefField = root.querySelector<HTMLElement>('[data-quote-brief]')!;
  const briefInput = briefField.querySelector<HTMLTextAreaElement>('textarea')!;

  // The brief only applies to custom software. A hidden `required` control
  // would block submission outright, so required tracks visibility.
  const syncBriefField = () => {
    const { custom } = computeTotals(state);
    briefField.hidden = !custom;
    briefInput.required = custom;
  };

  const renderTotal = () => {
    const { onceOff, monthly, custom, quotedExtras } = computeTotals(state);
    const once = custom
      ? `<strong class="quoted">Quoted on scope</strong><span>software builds are priced per project</span>`
      : `<strong>${zar(onceOff)}</strong><span>once-off</span>`;
    totalEl.innerHTML =
      once +
      (monthly > 0 ? `<strong class="monthly">+ ${zar(monthly)}</strong><span>per month</span>` : '') +
      (quotedExtras.length > 0
        ? `<span class="quote-extra-note">+ ${quotedExtras.join(', ')} — quoted separately</span>`
        : '');
  };

  // Base radios.
  root.querySelectorAll<HTMLInputElement>('[data-bases] input').forEach((input) => {
    input.addEventListener('change', () => {
      state.base = input.value;
      root.querySelectorAll('[data-bases] .quote-opt').forEach((o) => o.classList.remove('selected'));
      input.closest('.quote-opt')?.classList.add('selected');
      renderTotal();
      syncBriefField();
    });
  });

  // Add-on checkboxes.
  root.querySelectorAll<HTMLInputElement>('[data-addons] input').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) state.addons.add(input.value);
      else state.addons.delete(input.value);
      input.closest('.quote-opt')?.classList.toggle('selected', input.checked);
      renderTotal();
    });
  });

  // Care radios.
  root.querySelectorAll<HTMLInputElement>('[data-care] input').forEach((input) => {
    input.addEventListener('change', () => {
      state.care = input.value;
      root.querySelectorAll('[data-care] .quote-opt').forEach((o) => o.classList.remove('selected'));
      input.closest('.quote-opt')?.classList.add('selected');
      renderTotal();
    });
  });

  // Extra-pages stepper.
  const setPages = (n: number) => {
    state.extraPages = Math.max(0, Math.min(20, n));
    pagesCount.textContent = String(state.extraPages);
    renderTotal();
  };
  root.querySelector('[data-pages-plus]')?.addEventListener('click', () => setPages(state.extraPages + 1));
  root.querySelector('[data-pages-minus]')?.addEventListener('click', () => setPages(state.extraPages - 1));

  // Submit → reuse the contact backend with the quote summary attached.
  const form = root.querySelector<HTMLFormElement>('[data-quote-form]')!;
  const status = root.querySelector<HTMLElement>('[data-quote-status]')!;
  const setStatus = (text: string, st: string) => {
    status.textContent = text;
    status.dataset.state = st;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const base = BASES.find((b) => b.id === state.base);
    const brief = String(data.get('brief') ?? '').trim();
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      project: base ? `Quote: ${base.label}` : 'Quote request',
      message: brief
        ? `Software request: ${brief}`
        : 'Quote request submitted from the website calculator.',
      quoteSummary: buildSummary(state),
      company: String(data.get('company') ?? '')
    };

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setStatus('Sending your estimate…', 'sending');

    try {
      const res = await fetchQuoteWithTimeout('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && result.ok) {
        setStatus('Thanks — your estimate is in. We will reply with a detailed quote shortly.', 'success');
        form.reset();
      } else {
        setStatus(result.error || 'Something went wrong. Please email us directly.', 'error');
      }
    } catch {
      setStatus('Network issue — please email us at pixelnode.studios@gmail.com.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  renderTotal();
}
