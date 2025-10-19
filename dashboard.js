(async () => {
  // 1. guard route
 const token = localStorage.getItem('gradeboard_token');
  if (!token) return (location.href = 'auth.html');

  // 2. theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    toggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  // 3. load semesters from server
  try {
    const semesters = await API.getSemesters();
    window.importSemestersFromServer(semesters);
  } catch (e) {
    console.warn('Server unreachable – using fallback', e);
    window.importSemestersFromServer([]);
  }
    if (realSemesters.length === 0) {
        createDefaultSemester();
    }
})();