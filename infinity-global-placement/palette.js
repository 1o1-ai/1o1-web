const palettes = ['midnight', 'ocean', 'dawn'];
const control = document.querySelector('#palette');
const storageKey = 'infinity-showcase-palette';
let palette = 'midnight';
try {
  const saved = localStorage.getItem(storageKey);
  if (palettes.includes(saved)) palette = saved;
} catch {
  // The selector still works when browser storage is unavailable.
}
document.documentElement.dataset.palette = palette;
control.value = palette;
control.addEventListener('change', () => {
  document.documentElement.dataset.palette = control.value;
  try {
    localStorage.setItem(storageKey, control.value);
  } catch {
    // Keep the active selection for this page.
  }
});
