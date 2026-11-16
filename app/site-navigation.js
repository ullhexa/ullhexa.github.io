import { bindPressActions } from "./press-action.js?v=20261110-link-fix";

const navigationGroups = [
  {
    key: "tools",
    categories: [
      { key: "plugins", label: "Plugins" },
      { key: "skins", label: "Serum 2 skins" }
    ]
  },
  {
    key: "web",
    categories: [
      { key: "dnd", label: "GM Console" },
      { key: "visualizers", label: "Visualizers" }
    ]
  }
];

// Parent routes open their first category. Existing direct category links stay valid.
export function resolveSiteRoute(route) {
  if (route === "sync") return "music"; // Preserve existing SYNC bookmarks.
  return navigationGroups.find(group => group.key === route)?.categories[0].key || route;
}

export function createSiteNavigation() {
  const root = document.querySelector(".siteNavigation");
  const mainLinks = [...root.querySelectorAll(".nav a")];
  const branches = root.querySelector(".menuBranches");
  const path = branches.querySelector("path");
  const selectedPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  selectedPath.classList.add("menuBranchSelected");
  branches.append(selectedPath);
  const groups = navigationGroups.map(group => {
    const parent = root.querySelector(`[href="#${group.key}"]`);
    const children = root.querySelector(`#${group.key}Navigation`);
    // The live holding page may still use the older, Tools-only menu.
    if (!parent || !children) return null;
    children.innerHTML = group.categories.map(({ key, label }) => `<a href="#${key}"><span class="navLabel">${label}</span></a>`).join("");
    return { ...group, parent, children, links: [...children.querySelectorAll("a")] };
  }).filter(Boolean);
  let activeGroup = null;

  for (const link of mainLinks) {
    if (link.querySelector(".navLabel")) continue;
    const label = document.createElement("span");
    label.className = "navLabel";
    label.textContent = link.textContent;
    link.replaceChildren(label);
  }

  bindPressActions(root, { selector: "nav a" });

  const drawBranches = () => {
    if (!activeGroup) return;
    const bounds = root.getBoundingClientRect();
    const source = activeGroup.parent.getBoundingClientRect();
    const targets = activeGroup.links.map(link => link.getBoundingClientRect());
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
    // Reuse the same measured geometry for the selected route. No extra layout or animation.
    const selectedIndex = activeGroup.links.findIndex(link => link.classList.contains("active"));
    selectedPath.setAttribute("d", selectedIndex < 0 ? "" :
      `M ${x} ${y} V ${branchY} H ${targetXs[selectedIndex]} V ${targets[selectedIndex].top - bounds.top}`);
  };

  // One observer covers either branch, browser zoom and resizing.
  const observer = new ResizeObserver(drawBranches);
  observer.observe(root);
  for (const group of groups) {
    group.links.forEach(link => observer.observe(link));
    observer.observe(group.parent);
  }

  return route => {
    const category = resolveSiteRoute(route);
    activeGroup = groups.find(group => group.categories.some(({ key }) => key === category)) || null;
    for (const group of groups) {
      const active = group === activeGroup;
      group.children.hidden = !active;
      group.parent.setAttribute("aria-expanded", String(active));
      for (const link of group.links) {
        const isPage = active && link.getAttribute("href") === `#${category}`;
        link.classList.toggle("active", isPage);
        if (isPage) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    }
    branches.toggleAttribute("hidden", !activeGroup);
    root.classList.toggle("hasCategories", Boolean(activeGroup));
    for (const link of mainLinks) {
      const isPage = link.getAttribute("href") === `#${category}`;
      link.classList.toggle("active", isPage || link === activeGroup?.parent);
      if (isPage) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    drawBranches();
    return Boolean(activeGroup);
  };
}
