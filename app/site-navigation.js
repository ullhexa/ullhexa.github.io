const categories = [
  { key: "plugins", label: "Plugins" },
  { key: "skins", label: "Serum 2 skins" },
  { key: "visualizers", label: "Visualizers" }
];

export function createSiteNavigation() {
  const root = document.querySelector(".siteNavigation");
  const mainLinks = [...root.querySelectorAll(".nav a")];
  const parent = root.querySelector('[href="#tools"]');
  const children = root.querySelector("#toolsNavigation");
  const branches = root.querySelector(".menuBranches");
  const path = branches.querySelector("path");

  children.innerHTML = categories.map(({ key, label }) => `<a href="#${key}">${label}</a>`).join("");
  const childLinks = [...children.querySelectorAll("a")];

  const drawBranches = () => {
    if (children.hidden) return;
    const bounds = root.getBoundingClientRect();
    const source = parent.getBoundingClientRect();
    const targets = childLinks.map(link => link.getBoundingClientRect());
    // Whole CSS-pixel centres keep the one-pixel outline crisp at normal zoom.
    const crisp = value => Math.round(value) + 0.5;
    const x = crisp(source.left + source.width / 2 - bounds.left);
    const y = source.bottom - bounds.top;
    const targetY = targets[0].top - bounds.top;
    const branchY = crisp((y + targetY) / 2);
    const targetXs = targets.map(rect => crisp(rect.left + rect.width / 2 - bounds.left));
    branches.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    path.setAttribute("d", [
      `M ${x} ${y} V ${branchY}`,
      `M ${Math.min(x, ...targetXs)} ${branchY} H ${Math.max(x, ...targetXs)}`,
      ...targetXs.map((targetX, i) => `M ${targetX} ${branchY} V ${targets[i].top - bounds.top}`)
    ].join(" "));
  };

  // One observer for the persistent navigation, including browser zoom and resizing.
  const observer = new ResizeObserver(drawBranches);
  observer.observe(root);
  childLinks.forEach(link => observer.observe(link));
  observer.observe(parent);

  return route => {
    const category = route === "tools" ? "plugins" : route;
    const inTools = categories.some(({ key }) => key === category);
    children.hidden = !inTools;
    branches.toggleAttribute("hidden", !inTools);
    root.classList.toggle("hasTools", inTools);
    parent.setAttribute("aria-expanded", String(inTools));
    for (const link of mainLinks) {
      const isPage = link.getAttribute("href") === `#${route}`;
      link.classList.toggle("active", isPage || (link === parent && inTools));
      if (isPage) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    for (const link of childLinks) {
      const active = inTools && link.getAttribute("href") === `#${category}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    drawBranches();
    return inTools;
  };
}
