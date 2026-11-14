// Start the public console directly. No access gate is required.
await import('./app.js?v=137');

// Bind only the visible DM document.
if (document.getElementById('donate-button') && new URLSearchParams(location.search).get('view') !== 'player') {
  import('./donate.js?v=122').catch(error => console.warn('Initial-press enhancement unavailable; the PayPal link still works.', error));
}
