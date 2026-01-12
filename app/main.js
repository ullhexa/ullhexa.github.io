import { startBackground } from "./bg.js";
startBackground();

const content = document.getElementById("content");


const pages = {
  home: () => "<h2>Home</h2><p>Welcome.</p>",
  projects: () => "<h2>Projects</h2><p>Project list.</p>",
  contact: () => "<h2>Contact</h2><p>Email: you@domain.com</p>",
};


function routeFromHash() {
  return (location.hash || "#home").slice(1);
}

function render() {
  const route = routeFromHash();
  const page = pages[route] || pages.home;
  content.innerHTML = page();
}

window.addEventListener("hashchange", render);
render();

