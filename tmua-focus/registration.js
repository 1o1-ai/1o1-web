const registeredKey='tmua-focus-registered-v1';
const eqOptions={
  pressure:['Use shorter timed drills','Practise flagging and moving on','Keep the current pace'],
  feedback:['Give me a counterexample','Let me explain my reasoning first','Show a worked solution'],
  help:['Give me a small hint','Show a worked example','Start with a simpler question'],
  recovery:['Give me a fresh question on the same idea','Let me review my notes first','Let me take a short break'],
  motivation:['Set one skill goal','Set a weekly practice goal','Show my progress across sessions']
};
function registrationPage(){
  return title('Register a new student','Create a named profile in this browser. Then take the IQ-style reasoning baseline and the EQ-style learning check-in.')+
  `<form id="register-student" class="coach coach-form">
    <label>Student name or nickname<input name="name" required maxlength="50" autocomplete="off"></label>
    <label>City or country (optional)<input name="city" maxlength="60" autocomplete="off"></label>
    <label>Target course (optional)<input name="course" maxlength="65" autocomplete="off"></label>
    <button>Create student profile</button><p id="register-status" role="status"></p>
  </form>`;
}
function onboardingPage(){
  const status=study.eqOnboarding;
  return title('Student onboarding','Use the reasoning results and your own feedback preferences to choose your first study session.')+
  `<div class="grid"><section class="card"><h2>IQ-style reasoning</h2><p>Eight TMUA-style questions in 12 minutes. The results show mathematical applications, reasoning and answer confidence.</p><p><strong>${study.baseline?'Completed · '+study.baseline.right+'/8 correct':'Ready to start'}</strong></p>${button(study.baseline?'View or retake baseline':'Set up reasoning baseline','baseline','')}</section>
  <section class="card"><h2>EQ-style learning check-in</h2><p>Five optional questions about pressure, feedback, help, recovery and motivation. The full coaching profile covers 20 aspects.</p><p><strong>${status==='completed'?'Completed':status==='skipped'?'Skipped · you can revisit':'Ready to start'}</strong></p>${button(status==='completed'?'Edit check-in':'Open EQ check-in','eq-checkin','')}${button('Explore all 20 aspects','emotional')}</section></div>
  <p class="muted">These are TMUA coaching exercises. They do not produce standardised IQ or EQ scores.</p>${button('Continue to study plan','plan')}`;
}
function eqCheckinPage(){
  const aspects=Object.fromEntries(emotionalGroups.flatMap(group=>group[1]).map(([id,label,prompt])=>[id,{label,prompt}]));
  return title('EQ-style learning check-in','Choose what you think would help today. You can skip any question or change your answers later.')+
  `<form id="eq-checkin-form" class="coach coach-form">
  ${Object.entries(eqOptions).map(([id,options])=>`<label>${aspects[id].prompt}<select name="${id}"><option value="">Prefer to skip</option>${options.map(option=>`<option ${study.eqChoices[id]===option?'selected':''}>${option}</option>`).join('')}</select></label>`).join('')}
  <div class="row"><button name="intent" value="save">Save my check-in</button><button class="secondary" name="intent" value="skip" formnovalidate>Skip for now</button></div></form>`;
}
function eqCoachingTip(){
  const choices=study.eqChoices;
  const supported=['pressure','feedback','help','recovery','motivation'].filter(id=>choices[id]);
  if(!supported.length)return '';
  return `<details class="section-title"><summary>Your coaching preferences</summary><ul>${supported.map(id=>`<li>${esc(choices[id])}</li>`).join('')}</ul>${button('Edit EQ check-in','eq-checkin')}</details>`;
}
