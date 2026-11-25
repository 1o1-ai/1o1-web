'use strict';

const run = document.querySelector('#run');
const findings = document.querySelector('#findings');
const status = document.querySelector('#status');
const review = document.querySelector('#review');
const action = document.querySelector('#action');
const receipt = document.querySelector('#receipt');

run.addEventListener('click', () => {
  const submitted = document.querySelector('[data-ownership="form"]').textContent;
  const declared = document.querySelector('[data-ownership="declaration"]').textContent;
  document.querySelector('#ownership-result').textContent =
    `Rowan Vale is listed at ${submitted} on the onboarding form and ${declared} on the ownership declaration.`;
  findings.hidden = false;
  status.textContent = 'Comparison complete. One discrepancy and one unreadable field.';
});

findings.querySelectorAll('.finding a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector(link.hash).open = true;
  });
});

review.addEventListener('submit', event => {
  event.preventDefault();
  receipt.textContent = `Recorded for this demo · ${action.value}`;
});

document.querySelector('#reset').addEventListener('click', () => {
  review.reset();
  receipt.textContent = '';
  findings.hidden = true;
  document.querySelectorAll('details').forEach(document => { document.open = false; });
  status.textContent = 'Ready to compare three documents.';
  run.focus();
});
