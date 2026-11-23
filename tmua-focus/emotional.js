// OECD SSES skill families inform the first five groups. The last group
// translates feedback and exam-preparation behaviours into coaching choices.
const emotionalGroups=[
['Emotional regulation',[
['pressure','Handling pressure','When the timer is running, what would help?','Rehearses a flag, move on, return routine.','Practise with a timer','paper1'],
['control','Managing frustration','After a frustrating mistake, what helps you continue?','Starts with a small question on the same idea.','Try a short set','drill1'],
['optimism','Optimism after setbacks','What helps you reset after a low score?','Looks at one specific improvement and sets a reachable target.','Review the latest mistakes','review']]],
['Study habits and follow-through',[
['persistence','Persistence','When your first strategy fails, what helps you try another?','Offers a hint and a different approach.','Open a guided drill','drill1'],
['responsibility','Follow-through','What helps you keep to a study commitment?','Breaks practice into a specific next activity.','Open the study plan','plan'],
['selfcontrol','Self-control','What helps you avoid rushing into an answer?','Prompts a final check of signs, conditions and the wording.','Practise checking answers','drill1'],
['motivation','Achievement motivation','What kind of goal gives you a reason to practise?','Sets a goal based on a skill the student wants to improve.','Choose a study goal','profile']]],
['Openness',[
['curiosity','Curiosity','What makes an unfamiliar maths problem interesting to you?','Invites the student to test a small case and notice a pattern.','Try a reasoning question','drill2'],
['creativity','Creativity','How often do you try two ways to solve the same problem?','Suggests comparing a sketch with an algebraic solution.','Explore a worked example','lesson-MM8'],
['tolerance','Openness to different approaches','How do you respond when someone solves a problem differently?','Invites the student to compare assumptions and see where each method works.','Compare proof methods','lesson-Prf']]],
['Working with others',[
['empathy','Empathy','How would you respond to a peer who feels discouraged after a mock?','Offers a role-play prompt about acknowledging frustration and asking what would help.','Open role-play','role-empathy'],
['trust','Trust and accepting support','What makes it easier to trust a peer’s explanation?','Encourages checking the reasoning together while appreciating the help.','Open role-play','role-trust']]],
['Engaging with others',[
['assertiveness','Assertiveness','What helps you speak up when an explanation seems wrong?','Prompts the student to point to the step they question and ask for evidence.','Open role-play','role-assertiveness'],
['sociability','Sociability and study preferences','Do you prefer studying alone, in pairs, or in a group?','Lets the student choose solo explanation or a discussion prompt.','Open role-play','role-sociability'],
['energy','Energy and engagement','When do you have the most energy for difficult practice?','Lets the student plan shorter sessions on low-energy days.','Adjust today’s plan','plan']]],
['Feedback and exam preparation',[
['awareness','Emotional self-awareness','What do you notice first when you start feeling stuck?','Invites the student to name what is happening and choose a next action.','Open your baseline','baseline'],
['feedback','Responding to correction','When you still believe an answer is right, what feedback helps?','Offers a counterexample or a chance to explain the original reasoning.','Try an error-spotting exercise','lesson-Err'],
['help','Help-seeking','What kind of help do you want when you can’t find a starting point?','Offers a hint, a worked example, or a smaller question.','Choose a help preference','baseline'],
['recovery','Recovery after mistakes','After a wrong answer, what would make you ready to try again?','Offers a fresh problem on the same idea after review.','Open the mistake notebook','review'],
['disagreement','Constructive disagreement','How would you challenge a claim while keeping the discussion productive?','Asks the student to state the claim fairly and provide a counterexample.','Open role-play','role-disagreement']]]
];
const sampleEmotional={
  amelia:{pressure:'I spend too long on the opening questions.',feedback:'Show me a counterexample first.',energy:'I concentrate best in short blocks.'},
  luca:{feedback:'Let me explain my original rule before showing the answer.',assertiveness:'I can describe the step I disagree with.',help:'A small hint is enough to get me started.'},
  zofia:{control:'I reset more easily after seeing one example.',help:'Work through the first step with me.',awareness:'I notice I start rereading the same line.'},
  ines:{motivation:'I like tracking questions completed within the time.',pressure:'A midpoint checkpoint helps me pace myself.',sociability:'I prefer a solo attempt, then a partner discussion.'},
  elin:{selfcontrol:'I need a deliberate sign check before submitting.',recovery:'A fresh question helps me see whether I fixed the mistake.',trust:'I want to verify the reasoning with the other person.'}
};
const exampleCheckIns={
  pressure:'A reminder to flag a question and move on would help.',
  control:'A brief reset and one simpler problem help me get back on track.',
  optimism:'Show me one thing I improved since the last mock.',
  persistence:'A hint that points to a different method helps me try again.',
  responsibility:'I follow through when I decide exactly which exercise to finish.',
  selfcontrol:'I want a reminder to check the question before submitting.',
  motivation:'A goal I can measure by the end of the week keeps me practising.',
  curiosity:'I like starting with a small case and guessing the pattern.',
  creativity:'I try to solve it algebraically and then draw it.',
  tolerance:'I want to see where the other method is quicker.',
  empathy:'I’d ask which question we could work through together.',
  trust:'I feel comfortable when we can explain the reasoning step by step.',
  assertiveness:'I prefer to ask about a specific step rather than interrupt the whole explanation.',
  sociability:'I work better alone first, then explain my solution to someone.',
  energy:'I prefer demanding questions early in the session.',
  awareness:'I notice I start reading the same part of the question repeatedly.',
  feedback:'Ask me to test my rule on a counterexample.',
  help:'Give me a hint about the first step.',
  recovery:'I want a fresh question on the same idea.',
  disagreement:'I would repeat their claim in my own words before challenging it.'
};
const rolePlays={
  empathy:'A classmate says “I missed five questions, so I’m hopeless at maths.” Write a response that acknowledges the feeling and asks which question they’d like to review together.',
  trust:'A peer offers a shortcut you haven’t seen. How could you thank them, then check the shortcut on a simple case?',
  assertiveness:'A study partner divides by x in a proof. How would you ask about x = 0 and invite them to revise that step?',
  sociability:'Explain a solution aloud on your own, or take turns with a partner asking “Why does that step follow?” Which format helped you most?',
  disagreement:'A partner claims a² = b² always implies a = b. Restate the claim fairly, offer a counterexample, and agree on a corrected statement.'
};
function emotionalPage(){
  const sample=profile.id==='mine'?{}:{...exampleCheckIns,...sampleEmotional[profile.id]};
  const saved=Object.keys(study.emotional).length;
  return title('Social and emotional learning','Explore 20 coaching aspects. Open any aspect to see how it could influence study support. Check-ins are optional and can be edited.')+
  `<p>${saved} of 20 aspects with a student check-in${profile.id==='mine'?'':' · Demo profiles include fictional examples'}</p>`+
  emotionalGroups.map(([group,aspects])=>`<h2 class="section-title">${group}</h2><div class="grid">${aspects.map(([id,label,prompt,response,cta,action])=>{
    const entry=study.emotional[id];
    return `<details id="eq-${id}" class="card"><summary>${label} <span class="muted">· ${entry?'Student check-in':sample[id]?'Fictional example':'Awaiting check-in'}</span></summary>
      ${entry?`<p>${esc(entry)}</p>`:sample[id]?`<p>${esc(sample[id])}</p>`:''}<p><strong>Coaching response</strong><br>${response}</p>
      <form class="coach-form" data-emotional="${id}"><label>${prompt}<textarea name="reflection" maxlength="300">${esc(entry??'')}</textarea></label><div class="row"><button>Save check-in</button>${button(cta,action)}</div><p id="saved-${id}" role="status"></p></form>
    </details>`;
  }).join('')}</div>`).join('')+
  '<p class="muted">An independent coaching view informed by the <a href="https://www.oecd.org/en/about/programmes/oecd-survey-on-social-and-emotional-skills.html">OECD social and emotional skills framework</a>.</p>';
}
