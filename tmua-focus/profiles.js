const demoProfiles = [
  {id:'amelia',name:'Amelia Clarke',city:'Bristol, United Kingdom',course:'Mathematics',weeks:6,minutes:25,need:'timing',confidence:3,focus:['MM4','MM7','MM8'],strength:['MM1','MM2'],note:'I usually find a route, but spend too long on the first few questions.'},
  {id:'luca',name:'Luca Bianchi',city:'Milan, Italy',course:'Mathematics and Computer Science',weeks:8,minutes:20,need:'reasoning',confidence:2,focus:['Arg','Prf','Err'],strength:['MM3','MM6'],note:'I mix up the converse and the contrapositive when I work quickly.'},
  {id:'zofia',name:'Zofia Kowalska',city:'Kraków, Poland',course:'Computer Science',weeks:12,minutes:15,need:'concepts',confidence:2,focus:['MM5','MM6','MM7'],strength:['Arg','Err'],note:'I want worked examples before I try calculus on my own.'},
  {id:'ines',name:'Inês Silva',city:'Porto, Portugal',course:'Mathematics and Statistics',weeks:4,minutes:35,need:'timing',confidence:4,focus:['M7','MM8','Prf'],strength:['M6','MM1'],note:'My untimed work is going well. I want practice making faster decisions.'},
  {id:'elin',name:'Elin Andersson',city:'Uppsala, Sweden',course:'Mathematics and Philosophy',weeks:8,minutes:25,need:'accuracy',confidence:3,focus:['M2','MM2','Err'],strength:['Arg','Prf'],note:'Sign mistakes and missing cases cost me marks even when I know the method.'}
];
const needs = {general:'Balanced practice',concepts:'Understand the methods',reasoning:'Follow mathematical arguments',timing:'Manage time under pressure',accuracy:'Avoid careless errors'};
const ownProfile={id:'mine',name:'My practice',city:'Personal workspace',course:'TMUA preparation',weeks:6,minutes:25,need:'general',confidence:3};
const profiles=[ownProfile,...demoProfiles];
function seedProfile(profile){
  if(profile.id==='mine')return {progress:empty(),study:defaultStudy()};
  const state=defaultStudy();
  state.weeks=profile.weeks;
  Object.assign(state.coach,{minutes:profile.minutes,need:profile.need,confidence:profile.confidence,reflection:profile.note});
  const missed=[];
  const now=Date.now();
  for(const code of [...profile.focus,...profile.strength]){
    const questions=bank.filter(q=>q.module===code&&q.hint);
    const total=2;
    const right=profile.focus.includes(code)?1:2;
    state.stats[code]={right,total,seconds:profile.need==='timing'?total*260:total*155,timed:total};
    if(right<total){
      const q=questions[0];
      missed.push(q.id);
      state.due[q.id]=now-86400000;
      state.notes[q.id]=profile.note;
    }else state.lessons.push(code);
  }
  const stats=Object.values(state.stats);
  const answered=stats.reduce((sum,item)=>sum+item.total,0);
  const right=stats.reduce((sum,item)=>sum+item.right,0);
  state.history.push({at:now-86400000,label:'Sample baseline',right,total:answered});
  return {progress:{sessions:1,answered,right,missed},study:state};
}
function getRecommendation(){
  const baselineRecommendation=initialBaselineRecommendation();
  if(baselineRecommendation)return baselineRecommendation;
  const map=Object.fromEntries(modules.map(module=>[module[0],module[1]]));
  const {need,confidence,minutes}=study.coach;
  const latest=study.attempts.slice(-12);
  const recentMisses=[...new Map(latest.map(attempt=>[attempt.id,attempt])).values()].filter(attempt=>!attempt.correct);
  const attempted=Object.keys(study.stats).filter(code=>map[code]&&study.stats[code].total);
  if(!attempted.length && !dueIds().length){
    return {title:'Establish your baseline',reason:'Your diagnostic will show which topics to focus on first.',action:'baseline',label:'Open Learning Baseline'};
  }
  const code=Object.keys(map).sort((a,b)=>priority(b)-priority(a))[0];
  function priority(topic){
    const stat=study.stats[topic];
    const accuracy=stat?.total?stat.right/stat.total:null;
    const weakness=accuracy===null?0.25:1-accuracy;
    const pace=stat?.timed?Math.min(0.6,Math.max(0,stat.seconds/stat.timed/225-1)):0;
    const due=dueIds().filter(id=>bank[id].module===topic).length;
    const explained=recentMisses.filter(attempt=>bank[attempt.id].module===topic&&study.reasons[attempt.id]).length;
    return weakness+explained*0.2+due*0.12+(need==='timing'?pace*2:pace)+(need==='reasoning'&&['Arg','Prf','Err'].includes(topic)?0.45:0);
  }
  const stat=study.stats[code];
  const record=stat?.total?stat.right+'/'+stat.total+' correct':'No attempts yet';
  const pace=stat?.timed?' · '+Math.round(stat.seconds/stat.timed)+'s per answered question':'';
  const topic='Focus on '+map[code];
  const reasons=recentMisses.map(attempt=>study.reasons[attempt.id]);
  const rushed=latest.filter(attempt=>attempt.timed&&!attempt.answered).length;
  if(rushed>=3||reasons.filter(reason=>reason==='pace').length>=2)
    return {title:'Practise moving on under time pressure',reason:'You recorded several timing misses. Give each question one clear attempt, flag it if you stall, and return after the first pass.',action:'pace-'+code,label:'Start a pacing drill'};
  const fragile=fragileAttempts();
  if(fragile.length)
    return {title:'Test how well the method sticks',reason:'You guessed or missed a question you felt sure about. Try another question on the same topic to check your reasoning.',action:'verify',label:'Start a confidence check'};
  if(reasons.filter(reason=>reason==='concept'||reason==='logic').length>=2)
    return {title:topic,reason:'Your recent mistake reviews point to gaps in the method or reasoning. Work through the example before another drill.',action:'lesson-'+code,label:'Review the method'};
  if(reasons.filter(reason=>reason==='calculation').length>=2)
    return {title:topic,reason:'You marked several calculation errors. Write each step, then check signs and substitute your result before choosing an answer.',action:'coach-'+code,label:'Practise checking your work'};
  if((confidence<=2||need==='concepts')&&!study.lessons.includes(code))return {title:topic,reason:record+pace+'. Start with the worked example, then try a short drill.',action:'lesson-'+code,label:'Open the lesson'};
  if(need==='timing'&&minutes>=12&&stat?.total&&stat.right/stat.total>=0.5)return {title:'Practise pacing in '+map[code],reason:record+pace+'. Use the timer to practise deciding when to move on.',action:'pace-'+code,label:'Start a timed drill'};
  if(dueIds().some(id=>bank[id].module===code))return {title:'Revisit '+map[code],reason:record+pace+'. A previous mistake in this topic is ready to retry.',action:'due-'+code,label:'Retry due questions'};
  return {title:topic,reason:record+pace+'. Try a short set and review your reasoning after each answer.',action:'coach-'+code,label:'Start a guided drill'};
}

const mistakeReasons={concept:'I misunderstood the method',logic:'I missed a condition or reasoning step',calculation:'I made a calculation or sign error',pace:'I ran out of time'};
function fragileAttempts(){
  const latest=new Map();
  for(const attempt of study.attempts)latest.set(attempt.id,attempt);
  return [...latest.values()].filter(attempt=>!attempt.confirmed&&(attempt.confidence==='guess'||(attempt.confidence==='sure'&&!attempt.correct)));
}
function coachingInsight(){
  const attempts=study.attempts.slice(-24);
  const rated=attempts.filter(attempt=>attempt.confidence);
  const sure=rated.filter(attempt=>attempt.confidence==='sure');
  const guesses=rated.filter(attempt=>attempt.confidence==='guess'&&attempt.correct);
  const skipped=attempts.filter(attempt=>attempt.timed&&!attempt.answered);
  const fragile=fragileAttempts();
  return `<section class="coach"><h2>How you answer</h2>
    <p class="muted">${attempts.length?'Based on your last '+attempts.length+' recorded questions.':'Rate your confidence during untimed practice to see patterns here.'}</p>
    ${attempts.length?`<dl><dt>Confident answers correct</dt><dd>${sure.length?sure.filter(attempt=>attempt.correct).length+' of '+sure.length:'No confident ratings yet'}</dd><dt>Correct guesses</dt><dd>${guesses.length}</dd><dt>Questions skipped in timed practice</dt><dd>${skipped.length}</dd></dl>`:''}
    ${fragile.length?button('Verify a guess or confident mistake','verify',''):''}</section>`;
}

const stuckOptions={example:'See a worked example',hint:'Get a small hint and try again',move:'Move on and come back',check:'Check my working step by step'};
function baselineSetup(){
  return title('Learning Baseline','Eight TMUA-style questions in 12 minutes. Work without a calculator. You can skip and return to questions, and rate your confidence before seeing any answers.')+
    `<form id="baseline-setup" class="coach coach-form"><label>When you get stuck, what helps? <select name="stuck"><option value="">Skip this check-in</option>${Object.entries(stuckOptions).map(([value,label])=>`<option value="${value}" ${study.stuck===value?'selected':''}>${label}</option>`).join('')}</select></label><div class="row"><button name="intent" value="start">Start the 12-minute baseline</button><button class="secondary" name="intent" value="save">Save preference and return</button></div></form>`;
}
function baselineSummary(){
  const result=study.baseline;
  if(!result)return '';
  const {right,total,applications,reasoning,answered,guesses,confidentMisses,rated,elapsed,expired}=result;
  return `<section class="coach"><h2>Learning Baseline</h2><p><strong>${right}/${total} correct</strong> · ${total-answered} skipped · ${Math.floor(elapsed/60)}m ${elapsed%60}s${expired?' · Timer expired':''}</p>
  <p>Applications ${applications[0]}/${applications[1]} · Reasoning ${reasoning[0]}/${reasoning[1]}</p>
  <p>${rated?`${rated}/${answered} answers rated · ${guesses} correct guesses · ${confidentMisses} confident mistakes`:'No confidence ratings recorded.'}</p>
  <p>${study.stuck?'When stuck, you prefer to '+esc(stuckOptions[study.stuck].toLowerCase())+'. ':''}This is a starting point for coaching. Recommendations update as you practise.</p>
  ${button('Edit preference or retake','baseline')}</section>`;
}
function initialBaselineRecommendation(){
  const result=study.baseline;
  if(!result||study.sessionAfterBaseline!==progress.sessions)return;
  const {applications,reasoning,answered,total,expired,firstMiss}=result;
  const lower=reasoning[0]/reasoning[1]<applications[0]/applications[1]?'Arg':'MM1';
  const topic=bank[firstMiss]?.module??lower;
  if(expired&&total-answered>=2)
    return {title:'Practise when to move on',reason:'The timer expired with '+(total-answered)+' questions unanswered. Try a short timed drill and flag questions when you stall.',action:'pace-'+topic,label:'Start a pacing drill'};
  if(fragileAttempts().length)
    return {title:'Check your reasoning on a fresh question',reason:'Your confidence ratings surfaced a guess or a confident mistake. Try a different question on the same topic.',action:'verify',label:'Start a confidence check'};
  if(firstMiss!==undefined&&(study.stuck==='example'||reasoning[0]<reasoning[1]&&lower==='Arg'))
    return {title:'Start with a worked example',reason:'Your baseline flagged a question in '+bank[firstMiss].topic+'. Compare your approach with a worked example, then retry the method.',action:'lesson-'+topic,label:'Open the lesson'};
  return {title:firstMiss===undefined?'Build on your baseline':'Practise '+bank[firstMiss].topic,reason:firstMiss===undefined?'You answered every baseline question correctly. Try a harder problem to check how well the method transfers.':(study.stuck==='check'?'Write each step and check it against the question before choosing an answer.':study.stuck==='move'?'Flag a question if you stall and return after the first pass.':'Try a short set in a topic where you missed a question. Open a hint if you get stuck.'),action:'coach-'+topic,label:'Start a guided drill'};
}
