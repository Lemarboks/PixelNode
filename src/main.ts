import './styles.css';

const header = document.querySelector<HTMLElement>('[data-header]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-button]');
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.main-nav a'));
const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
const contactForm = document.querySelector<HTMLFormElement>('[data-contact-form]');
const formStatus = document.querySelector<HTMLElement>('[data-form-status]');
const cursorGlow = document.querySelector<HTMLElement>('[data-cursor-glow]');
const revealItems = Array.from(
  document.querySelectorAll<HTMLElement>(
    '.hero-copy > *, .hero-visual, .page-hero > *, .service-card, .section-heading, .work-card, .about-panel, .stats-grid > div, .contact-copy, .contact-form, .page-cta > *'
  )
);
const tiltCards = Array.from(document.querySelectorAll<HTMLElement>('.tilt-card'));
const canAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkPage = href.split('#')[0] || 'index.html';
    link.classList.toggle('active', linkPage === currentPage || (currentPage === '' && linkPage === 'index.html'));
  });
};

menuButton?.addEventListener('click', () => {
  const isOpen = nav?.classList.toggle('open') ?? false;
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('scroll', () => {
  setHeaderState();
  updateActiveLink();
});

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

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const data = new FormData(contactForm);
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const project = String(data.get('project') ?? '').trim();
  const message = String(data.get('message') ?? '').trim();

  const subject = encodeURIComponent(`PixelNode project inquiry from ${name}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nProject type: ${project}\n\nProject details:\n${message}`
  );

  if (formStatus) {
    formStatus.textContent = 'Opening your email app with the project details ready to send.';
  }

  window.location.href = `mailto:hello@pixelnode.studio?subject=${subject}&body=${body}`;
  contactForm.reset();
});

setHeaderState();
updateActiveLink();
