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
  const sectionMap = new Map(
    links
      .map((link) => {
        const id = link.getAttribute("href");
        if (!id?.startsWith("#")) return null;
        const section = document.querySelector(id);
        return section ? [id, section] : null;
      })
      .filter(Boolean),
  );

  if (!sectionMap.size || !("IntersectionObserver" in window)) return;

  const syncActive = (activeId) => {
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === activeId;
      link.classList.toggle("is-active", isActive);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible?.target?.id) return;
      syncActive(`#${visible.target.id}`);
    },
    {
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0.1, 0.5, 0.9],
    },
  );

  for (const [id, section] of sectionMap.entries()) {
    observer.observe(section);
  }
}

applyPolicyConfig();
setupActiveNavState();
