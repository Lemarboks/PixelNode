import './styles.css';
import { initAnalytics } from './analytics';
import { initQuoteCalculator } from './quote';

initAnalytics();
initQuoteCalculator();

const header = document.querySelector<HTMLElement>('[data-header]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-button]');
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.main-nav a'));
const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
const contactForm = document.querySelector<HTMLFormElement>('[data-contact-form]');
const formStatus = document.querySelector<HTMLElement>('[data-form-status]');
const cursorGlow = document.querySelector<HTMLElement>('[data-cursor-glow]');
const bootSequence = document.querySelector<HTMLElement>('[data-boot]');
const terminal = document.querySelector<HTMLElement>('[data-terminal]');
const terminalToggle = document.querySelector<HTMLButtonElement>('[data-terminal-toggle]');
const terminalClose = document.querySelector<HTMLButtonElement>('[data-terminal-close]');
const terminalForm = document.querySelector<HTMLFormElement>('[data-terminal-form]');
const terminalOutput = document.querySelector<HTMLElement>('[data-terminal-output]');
const rackButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-server]'));
const labReadout = document.querySelector<HTMLElement>('[data-lab-readout]');
const deploySim = document.querySelector<HTMLButtonElement>('[data-deploy-sim]');
const revealItems = Array.from(
  document.querySelectorAll<HTMLElement>(
    '.hero-copy > *, .hero-visual, .page-hero > *, .service-card, .section-heading, .work-card, .about-panel, .about-hud, .about-signal, .about-value, .case-study, .status-card, .testimonial, .story-body, .timeline-item, .expertise-card, .achievement, .founder-project, .article-card, .connect-link, .blog-card, .stats-grid > div, .contact-copy, .contact-form, .page-cta > *, .control-card, .ops-card, .deployment-card, .lab-console > *, .frame-card, .manifesto-strip > *, .log-panel'
  )
);
const tiltCards = Array.from(document.querySelectorAll<HTMLElement>('.tilt-card'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const backgroundVideos = Array.from(document.querySelectorAll<HTMLVideoElement>('.hero-background video'));
const navWithHints = navigator as Navigator & {
  connection?: { saveData?: boolean };
  mozConnection?: { saveData?: boolean };
  webkitConnection?: { saveData?: boolean };
  deviceMemory?: number;
};
const connection = navWithHints.connection || navWithHints.mozConnection || navWithHints.webkitConnection;
const isSamsungAndroid = /Samsung|SM-|SAMSUNG/i.test(navigator.userAgent);
const lowPowerDevice =
  prefersReducedMotion ||
  Boolean(connection?.saveData) ||
  (coarsePointer &&
    (/Android/i.test(navigator.userAgent) ||
      isSamsungAndroid ||
      Boolean(navWithHints.deviceMemory && navWithHints.deviceMemory <= 4) ||
      navigator.hardwareConcurrency <= 4));
const disableBackgroundVideo = prefersReducedMotion || Boolean(connection?.saveData);
const canAnimate = !lowPowerDevice && !coarsePointer;

document.documentElement.classList.toggle('low-power', lowPowerDevice);
document.documentElement.classList.toggle('no-video', disableBackgroundVideo);

if (disableBackgroundVideo) {
  backgroundVideos.forEach((video) => {
    video.pause();
    video.removeAttribute('autoplay');
    video.preload = 'none';
    video.querySelectorAll('source').forEach((source) => {
      source.dataset.src = source.getAttribute('src') || '';
      source.removeAttribute('src');
    });
    video.removeAttribute('src');
    video.load();
  });
}

const setHeaderState = () => {
  header?.classList.toggle('scrolled', window.scrollY > 12);
};

const closeMenu = () => {
  nav?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
};

const updateActiveLink = () => {
  if (sections.length > 1 && window.location.hash) {
    const current = sections.reduce((active, section) => {
      const top = section.getBoundingClientRect().top;
      return top <= 150 ? section.id : active;
    }, 'home');

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('active', isActive);
    });
    return;
  }

  // Normalise to a bare page name so clean Vercel URLs (/work) match
  // the .html hrefs in the nav (work.html), and "" / "index" map to home.
  const normalise = (p: string) => {
    const name = p.split('#')[0].split('/').pop() || '';
    const base = name.replace(/\.html$/, '');
    return base === '' || base === 'index' ? 'home' : base;
  };

  const currentPage = normalise(window.location.pathname);

  navLinks.forEach((link) => {
    const linkPage = normalise(link.getAttribute('href') || '');
    link.classList.toggle('active', linkPage === currentPage);
  });
};

menuButton?.addEventListener('click', () => {
  const isOpen = nav?.classList.toggle('open') ?? false;
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

let scrollTicking = false;

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(() => {
    scrollTicking = false;
    setHeaderState();
    updateActiveLink();
  });
}, { passive: true });

window.addEventListener('resize', () => {
  setHeaderState();
  updateActiveLink();
}, { passive: true });

if (canAnimate) {
  revealItems.forEach((item) => item.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  window.addEventListener('pointermove', (event) => {
    cursorGlow?.style.setProperty('--cursor-x', `${event.clientX}px`);
    cursorGlow?.style.setProperty('--cursor-y', `${event.clientY}px`);
  });

  tiltCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
      card.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

const CONTACT_EMAIL = 'pixelnode.studios@gmail.com';

const setFormStatus = (text: string, state: 'idle' | 'sending' | 'success' | 'error') => {
  if (!formStatus) return;
  formStatus.textContent = text;
  formStatus.dataset.state = state;
};

const mailtoFallback = (fields: Record<string, string>) => {
  const subject = encodeURIComponent(`PixelNode project inquiry from ${fields.name}`);
  const body = encodeURIComponent(
    `Name: ${fields.name}\nEmail: ${fields.email}\nProject type: ${fields.project}\n\nProject details:\n${fields.message}`
  );
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
};

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const data = new FormData(contactForm);
  const fields = {
    name: String(data.get('name') ?? '').trim(),
    email: String(data.get('email') ?? '').trim(),
    project: String(data.get('project') ?? '').trim(),
    message: String(data.get('message') ?? '').trim(),
    company: String(data.get('company') ?? '') // honeypot
  };

  const submitButton = contactForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  setFormStatus('Sending your project details…', 'sending');

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });

    const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

    if (response.ok && result.ok) {
      setFormStatus('Thanks — your message is in. We will reply shortly.', 'success');
      contactForm.reset();
    } else {
      setFormStatus(
        result.error || 'Something went wrong. Opening your email app as a backup…',
        'error'
      );
      if (response.status >= 500 || !result.error) mailtoFallback(fields);
    }
  } catch {
    // Network/API unreachable — never lose the lead, fall back to mailto.
    setFormStatus('Network issue — opening your email app with the details ready to send.', 'error');
    mailtoFallback(fields);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

setHeaderState();
updateActiveLink();

window.addEventListener('load', () => {
  window.setTimeout(() => bootSequence?.classList.add('complete'), 2100);
});

const writeTerminalLine = (text: string) => {
  if (!terminalOutput) return;
  const line = document.createElement('p');
  line.textContent = text;
  terminalOutput.append(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
};

const commandMap: Record<string, string> = {
  'deploy project': 'deploy queued -> pxn-web-052 | estimated completion: 42s',
  'view servers': 'edge-gateway online | web-cluster online | media-array 68% | backup-node synced',
  'open gallery': 'media pipeline opened -> 3 captured nodes decoded',
  status: 'uptime 99.98% | active deployments 18 | servers online 6 | projects running 12',
  help: 'commands: deploy project, view servers, open gallery, status'
};

terminalToggle?.addEventListener('click', () => {
  document.body.classList.toggle('terminal-mode');
  terminal?.classList.toggle('open');
});

terminalClose?.addEventListener('click', () => {
  document.body.classList.remove('terminal-mode');
  terminal?.classList.remove('open');
});

terminalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = terminalForm.querySelector<HTMLInputElement>('input');
  const command = String(input?.value || '').trim().toLowerCase();

  if (!command) return;
  writeTerminalLine(`> ${command}`);
  writeTerminalLine(commandMap[command] || 'unknown command. type: help');

  if (input) input.value = '';
});

rackButtons.forEach((button) => {
  button.addEventListener('click', () => {
    rackButtons.forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    if (labReadout) {
      labReadout.textContent = `server selected: ${button.getAttribute('data-server')} | diagnostics nominal`;
    }
  });
});

deploySim?.addEventListener('click', () => {
  if (labReadout) labReadout.textContent = 'deploying website... build passed -> route live';
  writeTerminalLine('deploy simulation complete -> pxn-demo promoted to live');
});
