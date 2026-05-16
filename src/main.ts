import './styles.css';

const header = document.querySelector<HTMLElement>('[data-header]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-button]');
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.main-nav a'));
const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
const contactForm = document.querySelector<HTMLFormElement>('[data-contact-form]');
const formStatus = document.querySelector<HTMLElement>('[data-form-status]');

const setHeaderState = () => {
  header?.classList.toggle('scrolled', window.scrollY > 12);
};

const closeMenu = () => {
  nav?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
};

const updateActiveLink = () => {
  const current = sections.reduce((active, section) => {
    const top = section.getBoundingClientRect().top;
    return top <= 150 ? section.id : active;
  }, 'home');

  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('active', isActive);
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
