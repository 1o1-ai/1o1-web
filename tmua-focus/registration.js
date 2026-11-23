const registeredKey='tmua-focus-registered-v1';
const eqOptions={
  pressure:['Use shorter timed drills','Practise flagging and moving on','Keep the current pace'],
  feedback:['Give me a counterexample','Let me explain my reasoning first','Show a worked solution'],
  help:['Give me a small hint','Show a worked example','Start with a simpler question'],
  recovery:['Give me a fresh question on the same idea','Let me review my notes first','Let me take a short break'],
  motivation:['Set one skill goal','Set a weekly practice goal','Show my progress across sessions'],
  control:['Pause and reset','Try a simpler example','Describe what frustrated me'],
  optimism:['See one recent improvement','Set a small achievable goal','Review what I can change next time'],
  persistence:['Try a different method','Ask for one hint','Take a break and return'],
  responsibility:['Pick an exact task','Schedule a regular session','Review what I completed last week'],
  selfcontrol:['Check signs and domains','Reread what the question asks','Substitute the answer to check'],
  curiosity:['Test a small case','Look for a pattern','Change an assumption and see what happens'],
  creativity:['Draw the problem','Solve it with algebra','Compare two different methods'],
  tolerance:['Hear the entire explanation first','Compare both methods on one example','Ask why a different approach works'],
  empathy:['Acknowledge how they feel','Ask what help they want','Offer to review one question together'],
  trust:['Check one example together','Ask for the reasoning step by step','Compare with a worked solution'],
  assertiveness:['Ask about a specific step','State my concern and suggest a test','Write my question before speaking'],
  sociability:['Work independently','Compare solutions with one partner','Discuss approaches as a group'],
  energy:['Start with a short warm-up','Do the hardest problem first','Choose a shorter study block'],
  awareness:['I reread the same line','I rush my calculations','I stop trying new approaches'],
  disagreement:['Restate their claim fairly','Test both claims on one example','Find a counterexample and discuss it']
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
const eqSectionCount=()=>emotionalGroups.length;
const eqAnswerCount=()=>Object.keys(study.eqChoices).length;
function onboardingPage(){
  const status=study.eqOnboarding;
  const hasDraft=study.eqDraft!==null;
  const deferred=status==='skipped';
  const ready=study.baseline&&(status==='completed'||deferred);
  const baselineAction=study.baselineDraft?button('Resume reasoning baseline','resume-baseline',''):button(study.baseline?'View or retake baseline':'Set up reasoning baseline','baseline','');
  const recommendation=ready?getRecommendation():null;
  return title('Student onboarding',esc(profile.name)+' · Complete the reasoning baseline and decide whether to share coaching preferences.')+
  `<div class="grid"><section class="card"><h2>IQ-style reasoning baseline</h2><p>Eight original TMUA-style questions in 12 minutes. The result covers mathematical applications, reasoning, timing and answer confidence.</p><p><strong>${study.baseline?'Completed · '+study.baseline.right+'/'+study.baseline.total+' correct':'Ready to start'}</strong></p>${baselineAction}</section>
  <section class="card"><h2>EQ-style learning assessment</h2><p>Twenty optional questions across six areas. Choose what helps you learn, handle setbacks and work with others.</p><p><strong>${hasDraft?'Draft saved':status==='completed'?eqAnswerCount()+' of 20 answered':deferred?'Skipped · you can revisit':'Ready to start'}</strong></p>${button(hasDraft?'Resume assessment':status==='completed'?'Edit assessment':'Start EQ assessment','eq-checkin','')} ${button('Open coaching profile','emotional')}</section></div>
  ${study.baseline?baselineSummary():''}
  ${recommendation?coachingPanel(recommendation):''}
  <p class="muted">These exercises provide a TMUA coaching baseline. They do not generate standardised IQ or EQ scores. Results stay in this browser.</p>${button('Continue to study plan','plan')}`;
}
function eqCheckinPage(){
  const section=Math.min(Math.max(study.eqSection,0),eqSectionCount()-1);
  const [group,aspects]=emotionalGroups[section];
  const choices=study.eqDraft??study.eqChoices;
  return title('EQ-style learning assessment','Choose the responses that fit you. Skip any question you prefer to leave blank.')+
  `<form id="eq-checkin-form" class="coach coach-form">
  <p class="eyebrow">Section ${section+1} of ${eqSectionCount()}</p>
  <h2>${group}</h2>
  <progress max="${eqSectionCount()}" value="${section+1}" aria-label="Assessment section"></progress>
  ${aspects.map(([id,,prompt])=>`<label>${prompt}<select name="${id}"><option value="">Prefer to skip</option>${eqOptions[id].map(option=>`<option ${choices[id]===option?'selected':''}>${option}</option>`).join('')}</select></label>`).join('')}
  <div class="row">${section?'<button class="secondary" name="intent" value="back">Previous section</button>':''}<button name="intent" value="save">${section+1===eqSectionCount()?'Finish and see results':'Save and continue'}</button><button class="secondary" name="intent" value="pause">Save and exit</button><button class="secondary" name="intent" value="skip">Skip assessment</button></div></form>`;
}
function eqCoachingTip(){
  if(!eqAnswerCount())return '';
  return `<details class="section-title"><summary>Your coaching preferences · ${eqAnswerCount()} of 20 answered</summary>
  ${emotionalGroups.map(([group,aspects])=>{
    const answered=aspects.filter(([id])=>study.eqChoices[id]);
    if(!answered.length)return '';
    return `<h3>${group}</h3><ul>${answered.map(([id,label])=>`<li><strong>${label}</strong> · ${esc(study.eqChoices[id])}</li>`).join('')}</ul>`;
  }).join('')}${button('Edit EQ assessment','eq-checkin')}</details>`;
}
