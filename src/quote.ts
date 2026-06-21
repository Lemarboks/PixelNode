// Interactive quote calculator for the Services page.
// Single source of truth for pricing — edit numbers here.

interface BaseOption {
  id: string;
  label: string;
  price: number;
  note: string;
}
interface AddOn {
  id: string;
  label: string;
  price: number;
  percent?: boolean; // price is a % of the running once-off total (e.g. rush)
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
  { id: 'redesign', label: 'Website redesign', price: 4500, note: 'refresh an existing site' }
];

const ADDONS: AddOn[] = [
  { id: 'extra-page', label: 'Extra page (each)', price: 650 },
  { id: 'hosting', label: 'Hosting & domain setup', price: 1200 },
  { id: 'photography', label: 'Photography / media', price: 850 },
  { id: 'homelab', label: 'Homelab / server setup', price: 3500 },
  { id: 'logo', label: 'Logo / brand basics', price: 1800 },
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
  let onceOff = base ? base.price : 0;

  // Flat add-ons first.
  for (const addon of ADDONS) {
    if (addon.percent) continue;
    if (addon.id === 'extra-page') {
      onceOff += addon.price * state.extraPages;
    } else if (state.addons.has(addon.id)) {
      onceOff += addon.price;
    }
  }
  // Percentage add-ons (e.g. rush) apply to the running once-off total.
  for (const addon of ADDONS) {
    if (addon.percent && state.addons.has(addon.id)) {
      onceOff += Math.round((onceOff * addon.price) / 100);
    }
  }

  const carePlan = CARE_PLANS.find((c) => c.id === state.care);
  const monthly = carePlan ? carePlan.price : 0;

  return { onceOff, monthly };
}

function buildSummary(state: QuoteState): string {
  const base = BASES.find((b) => b.id === state.base);
  const lines: string[] = [];
  if (base) lines.push(`Base: ${base.label}`);
  if (state.extraPages > 0) lines.push(`Extra pages: ${state.extraPages}`);
  for (const addon of ADDONS) {
    if (addon.id === 'extra-page') continue;
    if (state.addons.has(addon.id)) lines.push(`Add-on: ${addon.label}`);
  }
  const care = CARE_PLANS.find((c) => c.id === state.care);
  if (care && care.id !== 'none') lines.push(`Care plan: ${care.label} (${zar(care.price)}/mo)`);
  const { onceOff, monthly } = computeTotals(state);
  lines.push(`Estimated once-off: ${zar(onceOff)}`);
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
              <span class="quote-opt-price">from ${zar(b.price)}</span>
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
              <span class="quote-opt-price">${a.percent ? `+${a.price}%` : `+${zar(a.price)}`}</span>
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
          <label>Name <input type="text" name="name" autocomplete="name" required /></label>
          <label>Email <input type="email" name="email" autocomplete="email" required /></label>
          <div class="hp-field" aria-hidden="true"><label>Company <input type="text" name="company" tabindex="-1" autocomplete="off" /></label></div>
          <button class="button button-primary" type="submit">Get my detailed quote <span aria-hidden="true">-&gt;</span></button>
          <p class="form-status" role="status" data-quote-status></p>
        </form>
      </aside>
    </div>`;

  const totalEl = root.querySelector<HTMLElement>('[data-total]')!;
  const pagesCount = root.querySelector<HTMLElement>('[data-pages-count]')!;

  const renderTotal = () => {
    const { onceOff, monthly } = computeTotals(state);
    totalEl.innerHTML =
      `<strong>${zar(onceOff)}</strong><span>once-off</span>` +
      (monthly > 0 ? `<strong class="monthly">+ ${zar(monthly)}</strong><span>per month</span>` : '');
  };

  // Base radios.
  root.querySelectorAll<HTMLInputElement>('[data-bases] input').forEach((input) => {
    input.addEventListener('change', () => {
      state.base = input.value;
      root.querySelectorAll('[data-bases] .quote-opt').forEach((o) => o.classList.remove('selected'));
      input.closest('.quote-opt')?.classList.add('selected');
      renderTotal();
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
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      project: base ? `Quote: ${base.label}` : 'Quote request',
      message: 'Quote request submitted from the website calculator.',
      quoteSummary: buildSummary(state),
      company: String(data.get('company') ?? '')
    };

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setStatus('Sending your estimate…', 'sending');

    try {
      const res = await fetch('/api/contact', {
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
