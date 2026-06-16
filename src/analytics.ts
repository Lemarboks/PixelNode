// Consent-gated Google Analytics 4.
// GA only loads after the visitor explicitly accepts. Declining stores the
// choice and loads nothing — true opt-in consent (POPIA-friendly).

const GA_MEASUREMENT_ID = 'G-FT1E6S2FP7';
const CONSENT_KEY = 'pxn_cookie_consent'; // 'accepted' | 'declined'

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function loadGoogleAnalytics() {
  if (document.getElementById('ga-script')) return; // already loaded

  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function buildBanner(): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML = `
    <p>We use cookies to understand how the site is used and improve it. You can accept or decline analytics.</p>
    <div class="cookie-actions">
      <button type="button" class="cookie-btn cookie-decline" data-decline>Decline</button>
      <button type="button" class="cookie-btn cookie-accept" data-accept>Accept</button>
    </div>`;
  return banner;
}

function showBanner() {
  const banner = buildBanner();
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('visible'));

  banner.querySelector('[data-accept]')?.addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    loadGoogleAnalytics();
    banner.remove();
  });

  banner.querySelector('[data-decline]')?.addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    banner.remove();
  });
}

export function initAnalytics() {
  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'accepted') {
    loadGoogleAnalytics();
  } else if (consent === null) {
    showBanner();
  }
  // 'declined' → do nothing.
}
