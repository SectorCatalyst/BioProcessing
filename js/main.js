(() => {
  const navLinks = Array.from(document.querySelectorAll('.nav-list a'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const revealSections = Array.from(document.querySelectorAll('.reveal'));
  const hero = document.querySelector('.hero');
  const heroCopy = hero ? hero.querySelector('.hero-copy') : null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if (sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveLink(visible[0].target.id);
        }
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.2, 0.4, 0.6]
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  if (revealSections.length) {
    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      revealSections.forEach((section) => section.classList.add('in-view'));
    } else {
      revealSections.forEach((section) => section.classList.add('is-pending'));
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              entry.target.classList.remove('is-pending');
            }
          });
        },
        {
          rootMargin: '0px 0px -12% 0px',
          threshold: 0.14
        }
      );
      revealSections.forEach((section) => revealObserver.observe(section));
    }
  }

  const initHeroParallax = () => {
    if (!hero || !heroCopy) {
      return;
    }

    let rafId = null;

    const setHeroShift = () => {
      rafId = null;

      if (prefersReducedMotion.matches) {
        heroCopy.style.removeProperty('--hero-text-shift');
        return;
      }

      const rect = hero.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const maxShift = Math.min(hero.offsetHeight * 0.2, 112);

      if (rect.top >= viewportHeight) {
        heroCopy.style.setProperty('--hero-text-shift', '0px');
        return;
      }

      if (rect.bottom <= 0) {
        heroCopy.style.setProperty('--hero-text-shift', `${maxShift}px`);
        return;
      }

      const traveled = Math.min(Math.max(-rect.top, 0), hero.offsetHeight);
      const shift = Math.min(traveled * 0.26, maxShift);
      heroCopy.style.setProperty('--hero-text-shift', `${shift.toFixed(2)}px`);
    };

    const queueHeroShift = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(setHeroShift);
    };

    window.addEventListener('scroll', queueHeroShift, { passive: true });
    window.addEventListener('resize', queueHeroShift);

    if (typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', queueHeroShift);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
      prefersReducedMotion.addListener(queueHeroShift);
    }

    queueHeroShift();
  };

  initHeroParallax();

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) {
        return;
      }

      const targetEl = document.querySelector(targetId);
      if (!targetEl) {
        return;
      }

      event.preventDefault();
      targetEl.scrollIntoView({
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
      history.pushState(null, '', targetId);
    });
  });
})();
