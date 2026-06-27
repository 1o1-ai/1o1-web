(function () {
  'use strict';

  var GAMES = [
    { id: 'word-hunt', title: 'Word Hunter', sub: 'Hangman + MCQs', icon: '🎯', legacy: true, href: 'word-hunt.html' },
    { id: 'crossword', title: 'Crossword', sub: 'Chapter vocabulary', icon: '⊞' },
    { id: 'word-snake', title: 'Word Snake', sub: 'Chain terms', icon: '🐍' },
    { id: 'formula-scramble', title: 'Formula Scramble', sub: 'Rebuild equations', icon: '∑' },
    { id: 'concept-ladder', title: 'Concept Ladder', sub: 'Climb with answers', icon: '🪜' },
    { id: 'maze', title: 'Vocabulary Maze', sub: 'Collect terms', icon: '🌀' },
    { id: 'dominoes', title: 'Concept Dominoes', sub: 'Match pairs', icon: '🁢' },
    { id: 'definition-match', title: 'Definition Match', sub: 'Memory cards', icon: '🃏' },
    { id: 'anagram', title: 'Scientific Anagrams', sub: 'Unscramble', icon: '🔤' },
    { id: 'missing-letter', title: 'Missing Letter', sub: 'Complete words', icon: '✏️' },
    { id: 'odd-one-out', title: 'Odd One Out', sub: 'Find the mismatch', icon: '⚖️' },
    { id: 'classification', title: 'Classification', sub: 'Sort into groups', icon: '📂' },
    { id: 'timeline', title: 'Timeline Builder', sub: 'Order events', icon: '⏳' },
    { id: 'graph-detective', title: 'Graph Detective', sub: 'Read charts', icon: '📊' },
  ];

  var subjectEl = document.getElementById('gameSubject');
  var grid = document.getElementById('gameGrid');
  var stored = sessionStorage.getItem('cbse10_game_subject');
  if (stored && subjectEl) subjectEl.value = stored;

  function subjectParam() {
    return encodeURIComponent((subjectEl && subjectEl.value) || 'science');
  }

  function gameHref(g) {
    if (g.href) return g.href + (g.href.indexOf('?') >= 0 ? '&' : '?') + 'subject=' + subjectParam();
    return 'game-play.html?game=' + encodeURIComponent(g.id) + '&subject=' + subjectParam();
  }

  function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    GAMES.forEach(function (g) {
      var a = document.createElement('a');
      a.className = 'game-tile' + (g.legacy ? ' game-tile--legacy' : '');
      a.href = gameHref(g);
      a.innerHTML =
        '<span class="game-tile-icon">' + g.icon + '</span>' +
        '<span class="game-tile-title">' + g.title + '</span>' +
        '<span class="game-tile-sub">' + g.sub + '</span>';
      grid.appendChild(a);
    });
  }

  subjectEl && subjectEl.addEventListener('change', function () {
    sessionStorage.setItem('cbse10_game_subject', subjectEl.value);
    renderGrid();
  });

  renderGrid();
})();
