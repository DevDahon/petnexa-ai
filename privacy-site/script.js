const SITE_CONFIG = {
  effectiveDate: "June 20, 2026",
  contactEmail: "leaves0819@gmail.com",
  developerName: "Dahon",
};

function applyPolicyConfig() {
  document.querySelectorAll("[data-effective-date]").forEach((node) => {
    node.textContent = SITE_CONFIG.effectiveDate;
  });

  document.querySelectorAll("[data-developer-name]").forEach((node) => {
    node.textContent = SITE_CONFIG.developerName;
  });

  document.querySelectorAll("[data-contact-email]").forEach((node) => {
    node.textContent = SITE_CONFIG.contactEmail;
  });

  document.querySelectorAll("[data-contact-link]").forEach((node) => {
    node.setAttribute("href", `mailto:${SITE_CONFIG.contactEmail}`);
  });
}

function setupActiveNavState() {
  const links = [...document.querySelectorAll(".nav-link")];
  const sectionEntries =
    links
      .map((link) => {
        const id = link.getAttribute("href");
        if (!id?.startsWith("#")) return null;
        const section = document.querySelector(id);
        return section ? { id, link, section } : null;
      })
      .filter(Boolean);

  if (!sectionEntries.length) return;

  const syncActive = (activeId) => {
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === activeId;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  let forcedActiveId = null;
  let forcedActiveUntil = 0;

  const getActiveId = () => {
    if (forcedActiveId && Date.now() < forcedActiveUntil) return forcedActiveId;
    forcedActiveId = null;

    const hashEntry = sectionEntries.find((entry) => entry.id === window.location.hash);
    if (hashEntry) {
      const rect = hashEntry.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return hashEntry.id;
    }

    const offset = Math.min(window.innerHeight * 0.65, 520);
    const viewportBottom = window.scrollY + window.innerHeight;
    const documentBottom = document.documentElement.scrollHeight - 12;

    if (viewportBottom >= documentBottom) {
      return `#${sectionEntries[sectionEntries.length - 1].section.id}`;
    }

    let active = sectionEntries[0];
    for (const entry of sectionEntries) {
      if (entry.section.getBoundingClientRect().top <= offset) active = entry;
      else break;
    }
    return `#${active.section.id}`;
  };

  let ticking = false;
  const updateActiveFromScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      syncActive(getActiveId());
      ticking = false;
    });
  };

  for (const { id, link } of sectionEntries) {
    link.addEventListener("click", () => {
      forcedActiveId = id;
      forcedActiveUntil = Date.now() + 2200;
      syncActive(id);
    });
  }

  syncActive(getActiveId());
  window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
  window.addEventListener("resize", updateActiveFromScroll);

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(() => updateActiveFromScroll(), {
    rootMargin: "-10% 0px -70% 0px",
    threshold: [0, 0.25, 0.5, 1],
  });

  for (const { section } of sectionEntries) {
    observer.observe(section);
  }
}

applyPolicyConfig();
setupActiveNavState();
