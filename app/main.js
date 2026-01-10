const content = document.getElementById("content");
const log = document.getElementById("log");

const pages = {
  home: () => `
    <h2>Home</h2>
    <p>This is the front page content.</p>
  `,
  projects: () => `
    <h2>Projects</h2>
    <ul>
      <li>Project A</li>
      <li>Project B</li>
    </ul>
  `,
  contact: () => `
    <h2>Contact</h2>
    <p>Email: you@domain.com</p>
  `,
};

function routeFromHash() {
  return (location.hash || "#home").replace("#", "");
}

function render() {
  const route = routeFromHash();
  const page = pages[route] || pages.home;
  content.innerHTML = page();
}

window.addEventListener("hashchange", render);
render();

document.getElementById("btn").addEventListener("click", () => {
  log.textContent = `JS works: ${new Date().toISOString()}`;
});
