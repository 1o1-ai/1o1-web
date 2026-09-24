/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Shared Game Room grid. Renders the flagship games available to a track and a
  short line of bank stats, using window.BrahmexaGames.
*/
(function () {
  'use strict';

  var G = window.BrahmexaGames;
  var grid = document.getElementById('gameGrid');
  if (!grid) return;

  var GAMES = [
    { title: 'Hangman Quiz', sub: 'Reveal the term · MCQ duel', icon: '🎯', href: 'hangman-quiz.html', featured: true },
    { title: 'Battle Arena', sub: 'Defeat the concept bosses', icon: '⚔️', href: 'formula-arena.html', featured: true },
  ];

  if (!G) {
    grid.innerHTML = '<p class="game-room-empty">Question bank failed to load. Please refresh.</p>';
    return;
  }

  grid.innerHTML = '';
  GAMES.forEach(function (g) {
    var a = document.createElement('a');
    a.className = 'game-tile' + (g.featured ? ' game-tile--featured' : '');
    a.href = g.href;
    a.innerHTML =
      '<span class="game-tile-icon">' + g.icon + '</span>' +
      '<span class="game-tile-title">' + G.escapeHtml(g.title) + '</span>' +
      '<span class="game-tile-sub">' + G.escapeHtml(g.sub) + '</span>';
    grid.appendChild(a);
  });

  var s = G.stats();
  var note = document.createElement('p');
  note.className = 'game-room-stats';
  note.textContent = s.total + ' questions · ' + s.chapters + ' chapters · ' +
                     s.subjectCount + ' subjects · ' + G.label;
  grid.parentNode.appendChild(note);
})();
