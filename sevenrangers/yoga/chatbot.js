// Seven Rangers AI Healthcare Assistant Chatbot Logic

function toggleChatbot() {
  const panel = document.getElementById('chatPanel');
  panel.classList.toggle('active');
  
  // Clear pulse animation once user has interacted
  const pulse = document.querySelector('.chatbot-pulse');
  if (pulse) pulse.remove();
}

function openChatWithPrompt(promptText) {
  const panel = document.getElementById('chatPanel');
  if (!panel.classList.contains('active')) {
    panel.classList.add('active');
  }
  
  // Clear pulse animation
  const pulse = document.querySelector('.chatbot-pulse');
  if (pulse) pulse.remove();
  
  // Handle specific prompts
  handleUserMsg(promptText);
}

function handleInputKeydown(event) {
  if (event.key === 'Enter') {
    sendUserMsg();
  }
}

function sendUserMsg() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  
  input.value = '';
  handleUserMsg(text);
}

function handleUserMsg(text) {
  appendMessage(text, 'msg-user');
  
  // Scroll to bottom
  const body = document.getElementById('chatBody');
  body.scrollTop = body.scrollHeight;
  
  // Trigger bot reply after simulated delay
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const reply = getBotResponse(text);
    appendMessage(reply.html, 'msg-bot');
    if (reply.chips && reply.chips.length > 0) {
      appendChips(reply.chips);
    }
    body.scrollTop = body.scrollHeight;
  }, 1000);
}

function appendMessage(text, className) {
  const body = document.getElementById('chatBody');
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${className}`;
  msgDiv.innerHTML = text;
  body.appendChild(msgDiv);
}

function appendChips(chips) {
  const body = document.getElementById('chatBody');
  const chipsDiv = document.createElement('div');
  chipsDiv.className = 'chat-chips';
  chips.forEach(chip => {
    const chipEl = document.createElement('div');
    chipEl.className = 'chat-chip';
    chipEl.textContent = chip;
    chipEl.onclick = () => handleChipClick(chip);
    chipsDiv.appendChild(chipEl);
  });
  body.appendChild(chipsDiv);
}

function handleChipClick(chipText) {
  // Remove chips container to avoid cluttering
  event.target.parentElement.remove();
  handleUserMsg(chipText);
}

function showTypingIndicator() {
  const body = document.getElementById('chatBody');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg msg-bot typing-indicator';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = '<span style="display:inline-flex;gap:3px;"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span> Health Assistant is thinking...';
  body.appendChild(typingDiv);
  
  // Animation style
  const style = document.createElement('style');
  style.id = 'typingStyle';
  style.innerHTML = `
    @keyframes typingDot {
      0% { opacity: 0.2; }
      50% { opacity: 1; }
      100% { opacity: 0.2; }
    }
    .typing-indicator .dot {
      animation: typingDot 1.4s infinite;
    }
    .typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }
  `;
  document.head.appendChild(style);
  body.scrollTop = body.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
  const style = document.getElementById('typingStyle');
  if (style) style.remove();
}

function getBotResponse(input) {
  const text = input.toLowerCase();
  
  // 1. Booking / Appointment
  if (text.includes('book') || text.includes('appoint') || text.includes('schedule') || text.includes('consult')) {
    let docSuggest = '';
    if (text.includes('goutam') || text.includes('cardio') || text.includes('heart')) {
      docSuggest = "<strong>Dr. Goutam Das (Cardiology)</strong> is available on Mon - Wed (10AM - 2PM).";
    } else if (text.includes('sabyasachi') || text.includes('neuro') || text.includes('brain') || text.includes('spine')) {
      docSuggest = "<strong>Dr. Sabyasachi Basu (Neuro-Surgery)</strong> is available on Tue - Thu (12PM - 4PM).";
    } else if (text.includes('shubashis') || text.includes('haemat') || text.includes('blood')) {
      docSuggest = "<strong>Dr. Shubashis Saha (Haematology)</strong> is available on Wed - Fri (11AM - 3PM).";
    } else if (text.includes('manoj') || text.includes('pal')) {
      docSuggest = "<strong>Dr. Manoj Kumar Pal (General Medicine)</strong> is available Every Day (9AM - 5PM).";
    } else if (text.includes('dipanjan') || text.includes('medicine') || text.includes('general')) {
      docSuggest = "<strong>Dr. Manoj Kumar Pal</strong> (Every Day: 9AM - 5PM) and <strong>Dr. Dipanjan Chottopadhyay</strong> (Mon - Sat: 9AM - 1PM) lead our General Medicine department.";
    }
    
    return {
      html: `I can help you coordinate your booking! ${docSuggest ? docSuggest + ' ' : ''}Please tell me your preferred day and time. Alternatively, click below to confirm a callback with our medical reception desk.`,
      chips: ['📅 Confirm Callback', '🩺 Browse Doctors', '🏥 Main Menu']
    };
  }
  
  // 2. Doctor Schedules / Doctors List
  if (text.includes('doctor') || text.includes('schedule') || text.includes('specialist') || text.includes('opd')) {
    return {
      html: `Here are our active clinic specialists:<br><br>
             1. <strong>Dr. Manoj Kumar Pal</strong> - General Medicine (Every Day Lead)<br>
             2. <strong>Dr. Goutam Das</strong> - Cardiology<br>
             3. <strong>Dr. Sabyasachi Basu</strong> - Neuro-Surgery<br>
             4. <strong>Dr. Shubashis Saha</strong> - Haematology<br>
             5. <strong>Dr. Dipanjan Chottopadhyay</strong> - Gen Medicine & Critical Care<br><br>
             Which specialist department would you like to check or book?`,
      chips: ['❤️ Cardiology', '🧠 Neuro-Surgery', '🩸 Haematology', '🩺 General Medicine']
    };
  }
  
  // 3. Department Specifics
  if (text.includes('cardio') || text.includes('heart')) {
    return {
      html: `<strong>Cardiology Department:</strong> led by Dr. Goutam Das. We provide ECG, Echocardiogram, and preventative cardiac care. Would you like to schedule an appointment?`,
      chips: ['📅 Book Dr. Goutam Das', '🏥 Main Menu']
    };
  }
  if (text.includes('neuro') || text.includes('brain') || text.includes('spine')) {
    return {
      html: `<strong>Neuro-Surgery Department:</strong> led by Dr. Sabyasachi Basu. Specialists in microsurgery, neuropathies, and spine trauma. Would you like to request an appointment?`,
      chips: ['📅 Book Dr. Sabyasachi Basu', '🏥 Main Menu']
    };
  }
  if (text.includes('haemat') || text.includes('blood') || text.includes('anemia')) {
    return {
      html: `<strong>Haematology Department:</strong> led by Dr. Shubashis Saha. Specializing in clinical blood profiling, coagulopathy, and oncology.`,
      chips: ['📅 Book Dr. Shubashis Saha', '🏥 Main Menu']
    };
  }
  if (text.includes('medicine') || text.includes('general') || text.includes('critical')) {
    return {
      html: `<strong>General Medicine & Critical Care:</strong> led by our lead physician, Dr. Manoj Kumar Pal (available Every Day: 9AM - 5PM) and Dr. Dipanjan Chottopadhyay. Comprehensive diagnostics, outpatient consults, and intensive care monitoring.`,
      chips: ['📅 Book Dr. Manoj Kumar Pal', '📅 Book Dr. Dipanjan Chottopadhyay', '🏥 Main Menu']
    };
  }
  
  // 4. Symptoms Checker
  if (text.includes('symptom') || text.includes('assess') || text.includes('checker') || text.includes('pain') || text.includes('sick')) {
    return {
      html: `<strong>AI Symptoms Assistant:</strong> Please choose the symptom category you are experiencing for a preliminary layout check. (Disclaimer: This is for guidance only, call emergency services for critical issues).`,
      chips: ['Chest Tightness / Pain', 'Severe Headaches', 'Blood Profiles Check', 'Persistent Fever', '🏥 Main Menu']
    };
  }
  
  // 5. Symptom Replies
  if (text.includes('chest') || text.includes('tightness')) {
    return {
      html: `<span style="color:#ef4444; font-weight:bold;">⚠️ Important:</span> Chest pain can indicate critical cardiac concerns. We recommend consulting <strong>Dr. Goutam Das (Cardiology)</strong> immediately. Would you like to book?`,
      chips: ['📅 Consult Cardiology', '☎️ Emergency Numbers']
    };
  }
  if (text.includes('headache') || text.includes('migraine')) {
    return {
      html: `Persistent or severe headaches can be associated with neurological conditions. We suggest consulting <strong>Dr. Sabyasachi Basu (Neuro-Surgery)</strong>.`,
      chips: ['📅 Consult Neuro-Surgery', '🏥 Main Menu']
    };
  }
  if (text.includes('fever') || text.includes('cold') || text.includes('cough')) {
    return {
      html: `Persistent fever should be checked by our General Medicine lead, <strong>Dr. Dipanjan Chottopadhyay</strong>, to exclude systemic infection.`,
      chips: ['📅 Consult General Medicine', '🏥 Main Menu']
    };
  }
  
  // 6. Callback Confirmation
  if (text.includes('confirm') || text.includes('callback')) {
    return {
      html: `<span style="color:#10b981; font-weight:bold;">✓ Callback Scheduled!</span> An AI healthcare coordinator will contact you at your registered phone number within 15 minutes. Thank you!`,
      chips: ['🏥 Main Menu']
    };
  }
  
  // 7. General contact / info
  if (text.includes('contact') || text.includes('phone') || text.includes('call') || text.includes('number')) {
    return {
      html: `You can reach our helpdesk directly at <strong>+1 425-502-1519</strong> or email <strong>info@sevenrangershospital.com</strong>. Emergency services are active 24/7.`,
      chips: ['☎️ Emergency Numbers', '🏥 Main Menu']
    };
  }
  if (text.includes('emergency')) {
    return {
      html: `<strong style="color:#ef4444;">🚨 24/7 Critical Trauma Desk:</strong> Call our response team at <strong>+1 425-502-1519</strong> immediately. We have active standby ambulances and trauma rooms ready.`,
      chips: ['🏥 Main Menu']
    };
  }
  
  // Automated Digital Marketing Integration easter egg
  if (text.includes('marketing') || text.includes('digital') || text.includes('promote') || text.includes('growth') || text.includes('advertise')) {
    return {
      html: `<strong>Automated Digital Marketing by ManjuLAB:</strong> Yes! While I'm a health assistant, my parent platform—<strong>ManjuLAB</strong>—builds and hosts this exact cosmic stack, and includes automated AI-driven digital marketing engines (our REACH platform) to help clinics and local businesses grow their customer/patient base automatically. <br><br>Would you like to learn more about our automated marketing integrations?`,
      chips: ['📈 Automated Patient Growth', '✉️ Contact ManjuLAB', '🏥 Main Menu']
    };
  }
  if (text.includes('patient growth') || text.includes('reach platform')) {
    return {
      html: `Our automated patient acquisition system uses AI models to generate high-performing clinical campaigns, manage reviews, publish content, and execute localized Google/social media ads automatically. It drives new patients straight to your booking panel!`,
      chips: ['✉️ Contact ManjuLAB', '🏥 Main Menu']
    };
  }
  
  // 8. Greetings
  if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('menu')) {
    return {
      html: `How can I assist you today with our clinical services?`,
      chips: ['📅 Book an Appointment', '🩺 Check Doctor Schedules', '🧠 Assess Symptoms']
    };
  }
  
  // Fallback
  return {
    html: `I have noted your query: "<em>${input}</em>". To provide accurate assistance, I can arrange an automated callback with our healthcare desk. Would you like to confirm?`,
    chips: ['📅 Confirm Callback', '🩺 Check Doctor Schedules', '🏥 Main Menu']
  };
}
