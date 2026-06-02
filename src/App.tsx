import { motion } from 'framer-motion';
import { ArrowRight, Globe2, Menu, PlaySquare, Server, Workflow, X } from 'lucide-react';
import { useState } from 'react';
import heroImage from '../home-hero-poster.jpg';

const navItems = [
  { label: 'Home', href: 'index.html' },
  { label: 'Services', href: 'services.html' },
  { label: 'Work', href: 'work.html' },
  { label: 'About', href: 'about.html' },
  { label: 'Contact', href: 'contact.html' }
];

const featureCards = [
  {
    title: 'Modern Websites',
    description: 'Fast, responsive, conversion-focused websites.',
    icon: Globe2
  },
  {
    title: 'Hosting & Servers',
    description: 'Reliable hosting and infrastructure.',
    icon: Server
  },
  {
    title: 'Automation',
    description: 'Smart workflows that save time.',
    icon: Workflow
  },
  {
    title: 'Media & Content',
    description: 'Professional content and branding.',
    icon: PlaySquare
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

function CubeLogo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M32 4 58 19v28L32 62 6 47V19L32 4Zm0 9.8L16 23v18.6l6.8 3.9V27l9.2-5.3 16 9.2v-7.8L32 13.8Zm20 16.4L36.5 39.1v9.8l8.4-4.9 7.1 4.1V30.2ZM30 52.3V34.8l9.2-5.3-7.2-4.2-9.2 5.3v17.5l7.2 4.2Zm6.5-1.1L48 44.6l-5.1-2.9-6.4 3.7v5.8Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-5 sm:px-8 lg:px-14">
      <div className="mx-auto grid max-w-[1480px] grid-cols-[auto_auto] items-center gap-4 rounded-none border-0 border-white/10 bg-black/25 py-3 backdrop-blur-md md:grid-cols-[1fr_auto_1fr] md:bg-transparent md:py-6">
        <a className="inline-flex items-center gap-[10px] text-white" href="index.html" aria-label="PixelNode home">
          <CubeLogo />
          <span className="text-[1.55rem] font-semibold leading-none tracking-normal">PixelNode</span>
        </a>

        <nav className="hidden items-center justify-center gap-10 text-[1.02rem] font-medium text-white/86 md:flex lg:gap-14" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item.href} className="transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden justify-self-end md:block">
          <a className="inline-flex min-h-14 items-center justify-center gap-4 rounded-md bg-white px-8 text-base font-semibold text-black shadow-[0_18px_44px_rgba(0,0,0,0.35)] transition duration-200 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="contact.html">
            Start A Project
            <ArrowRight aria-hidden="true" size={19} strokeWidth={2.6} />
          </a>
        </div>

        <button
          className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-md border border-white/20 bg-black/35 text-white backdrop-blur-md md:hidden"
          type="button"
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
        </button>
      </div>

      {isOpen && (
        <motion.nav
          id="mobile-navigation"
          className="mx-auto mt-3 grid max-w-[1480px] gap-1 rounded-lg border border-white/12 bg-black/88 p-3 text-base font-medium text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden"
          aria-label="Mobile navigation"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {navItems.map((item) => (
            <a key={item.href} className="rounded-md px-3 py-3 hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href={item.href}>
              {item.label}
            </a>
          ))}
          <a className="mt-2 inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-white px-5 font-semibold text-black" href="contact.html">
            Start A Project
            <ArrowRight aria-hidden="true" size={18} />
          </a>
        </motion.nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <main>
      <section className="relative min-h-screen overflow-hidden bg-black px-6 pb-10 pt-32 sm:px-8 md:pt-40 lg:px-16" aria-label="PixelNode hero">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            className="h-full w-full scale-[1.04] object-cover object-center grayscale brightness-[0.48] contrast-125 blur-[1.5px]"
            src={heroImage}
            alt=""
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/58" />
          <div className="absolute inset-0 bg-black/22 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-10rem)] max-w-[1480px] flex-col justify-end gap-16">
          <motion.div
            className="max-w-[780px] pb-4 sm:pb-8 lg:pb-12"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.12, delayChildren: 0.12 }}
          >
            <motion.div className="mb-8 flex items-center gap-5" variants={fadeUp} transition={{ duration: 0.56, ease: 'easeOut' }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">PixelNode Studio</p>
              <span className="h-px w-16 bg-white/45" aria-hidden="true" />
            </motion.div>

            <motion.h1
              className="max-w-[790px] text-[clamp(3.35rem,9vw,6.8rem)] font-black leading-[0.96] tracking-normal text-white"
              variants={fadeUp}
              transition={{ duration: 0.62, ease: 'easeOut' }}
            >
              Building Websites, Automation &amp; Digital Infrastructure
            </motion.h1>

            <motion.p
              className="mt-8 max-w-[670px] text-lg leading-8 text-white/76 sm:text-2xl sm:leading-9"
              variants={fadeUp}
              transition={{ duration: 0.58, ease: 'easeOut' }}
            >
              Launch sharper digital projects with design, hosting, automation, and media in one focused studio.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
              variants={fadeUp}
              transition={{ duration: 0.58, ease: 'easeOut' }}
            >
              <a className="inline-flex min-h-16 items-center justify-center gap-4 rounded-md bg-white px-9 text-base font-bold text-black shadow-[0_18px_44px_rgba(0,0,0,0.38)] transition duration-200 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-w-[260px]" href="contact.html">
                Start A Project
                <ArrowRight aria-hidden="true" size={20} strokeWidth={2.6} />
              </a>
              <a className="inline-flex min-h-16 items-center justify-center gap-4 rounded-md border border-white/64 bg-black/18 px-9 text-base font-bold text-white backdrop-blur-sm transition duration-200 hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-w-[260px]" href="work.html">
                View Our Work
                <ArrowRight aria-hidden="true" size={20} strokeWidth={2.6} />
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="grid border-y border-white/14 bg-black/8 backdrop-blur-[2px] sm:grid-cols-2 lg:grid-cols-4 lg:border-y-0"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.64, delay: 0.58, ease: 'easeOut' }}
          >
            {featureCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="flex min-h-32 gap-5 border-white/18 px-2 py-6 sm:px-6 lg:border-l lg:first:border-l-0 xl:px-9">
                  <Icon className="mt-1 h-9 w-9 shrink-0 text-white/74" aria-hidden="true" strokeWidth={1.8} />
                  <div>
                    <h2 className="text-base font-bold text-white">{card.title}</h2>
                    <p className="mt-2 max-w-[16rem] text-base leading-7 text-white/68">{card.description}</p>
                  </div>
                </article>
              );
            })}
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Hero />
    </>
  );
}
