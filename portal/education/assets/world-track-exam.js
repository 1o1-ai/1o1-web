(function () {
  'use strict';
  const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  document.addEventListener('DOMContentLoaded', () => {
    const ul = document.getElementById('examList');
    if (!ul) return;
    ul.innerHTML = SUBJECTS.map(
      (s) => `<li><a href="practice.html">${s} — 5-question drill</a> (via Practice Tests)</li>`
    ).join('');
  });
})();
