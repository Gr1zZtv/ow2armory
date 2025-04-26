// initialData.js
(async () => {
  const KEY = 'armoryData';
  if (!localStorage.getItem(KEY)) {
    try {
      const resp = await fetch('./armoryData.json');
      if (!resp.ok) throw new Error(resp.statusText);
      const initial = await resp.json();
      localStorage.setItem(KEY, JSON.stringify(initial));
    } catch (err) {
      console.error('Failed to load initial armoryData:', err);
    }
  }
})();