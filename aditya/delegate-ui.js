/* DELEGATE MOCK UI - INTERACTIVE UI LOGIC & STATE MANAGEMENT
 * Platform Category: KAI247 -> SMB | Service: Delegate | Assistant: Adityam
 */

function getSeedGroups() {
  const src = (typeof DELEGATE_GROUPS !== "undefined" ? DELEGATE_GROUPS : (typeof window !== "undefined" ? window.DELEGATE_GROUPS : null));
  if (!src) return [];
  try {
    return JSON.parse(JSON.stringify(src));
  } catch (e) {
    return src;
  }
}

let delegateState = {
  isPaused: false,
  activeGroupId: "g8", // Default to Customer - Apex Mobility OEM
  signalOnly: true,
  activeIntelTab: "reply",
  groupFilter: "all",
  searchQuery: "",
  tourStep: 0,
  isTourActive: false,
  replyDrafts: {},
  groups: getSeedGroups()
};

function startDelegateApp() {
  if (!delegateState.groups || delegateState.groups.length === 0) {
    delegateState.groups = getSeedGroups();
  }

  // Check URL params or hash
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  if (hash === "#delegate" || (typeof window !== "undefined" && window.location.search.includes("tab=delegate"))) {
    if (typeof switchAdminTab === "function") switchAdminTab("delegate");
  }

  renderDelegateBriefing();
  renderDelegateGroups();
  renderDelegateChat();
  renderDelegateIntel();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDelegateApp);
  } else {
    setTimeout(startDelegateApp, 10);
  }
}

// MAIN TAB / VIEW SWITCHING
function setDelegateViewMode(mode) {
  const briefingView = document.getElementById("delegateBriefingView");
  const workspaceView = document.getElementById("delegateWorkspaceView");
  const btnBriefing = document.getElementById("btnViewBriefing");
  const btnWorkspace = document.getElementById("btnViewWorkspace");

  if (mode === "briefing") {
    if (briefingView) briefingView.style.display = "block";
    if (workspaceView) workspaceView.style.display = "none";
    if (btnBriefing) btnBriefing.classList.add("active");
    if (btnWorkspace) btnWorkspace.classList.remove("active");
  } else {
    if (briefingView) briefingView.style.display = "none";
    if (workspaceView) workspaceView.style.display = "flex";
    if (btnBriefing) btnBriefing.classList.remove("active");
    if (btnWorkspace) btnWorkspace.classList.add("active");

    renderDelegateGroups();
    renderDelegateChat();
    renderDelegateIntel();

    if (workspaceView) {
      workspaceView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// RENDER EXECUTIVE MORNING BRIEFING
function renderDelegateBriefing() {
  const b = DELEGATE_BRIEFING;
  const cardsContainer = document.getElementById("briefingCardsContainer");
  if (!cardsContainer) return;

  cardsContainer.innerHTML = b.priorityCards.map(c => `
    <div class="card-panel priority-card priority-${c.urgency}" style="cursor:pointer;" onclick="openGroupFromBriefing('${c.groupId}')">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
        <span class="status-badge st-${c.urgency === 'critical' ? 'needs-data' : 'demonstrated'}" style="font-size:0.7rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> ${c.type}
        </span>
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">${c.groupName}</span>
      </div>
      <h4 style="font-size:0.95rem; font-weight:800; color:var(--text-main); margin-bottom:0.4rem;">${c.title}</h4>
      <p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.45;">${c.desc}</p>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;" onclick="event.stopPropagation()">
        <button class="btn btn-primary btn-xs" onclick="openGroupFromBriefing('${c.groupId}')"><i class="fa-solid fa-reply"></i> ${c.actionLabel}</button>
        <button class="btn btn-outline btn-xs" onclick="openGroupFromBriefing('${c.groupId}')">${c.secondaryAction}</button>
        <button class="btn btn-secondary btn-xs" onclick="openDelegateModal('${c.groupId}')">${c.delegateAction}</button>
      </div>
    </div>
  `).join('');

  const digestContainer = document.getElementById("briefingDigestContainer");
  if (digestContainer) {
    digestContainer.innerHTML = b.digest.map(d => `
      <div style="display:flex; gap:0.75rem; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color); font-size:0.825rem; cursor:pointer;" onclick="setDelegateViewMode('workspace')">
        <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted); min-width:65px;">${d.time}</span>
        <span class="p-tag p-tag-blue" style="font-size:0.7rem; min-width:140px;">${d.group}</span>
        <span style="color:var(--text-main);">${d.text}</span>
      </div>
    `).join('');
  }
}

function openGroupFromBriefing(groupId) {
  delegateState.activeGroupId = groupId;
  setDelegateViewMode("workspace");
}

// RENDER GROUPS LIST (LEFT COLUMN)
function renderDelegateGroups() {
  const container = document.getElementById("delegateGroupsList");
  if (!container) return;

  let filtered = delegateState.groups;

  // Filter
  const f = delegateState.groupFilter;
  if (f === "needs_aditya") filtered = filtered.filter(g => g.priority === "high" || g.priority === "critical" || g.state === "Drafting");
  else if (f === "customer") filtered = filtered.filter(g => g.type.includes("Customer"));
  else if (f === "internal") filtered = filtered.filter(g => g.type.includes("Internal"));
  else if (f === "supplier") filtered = filtered.filter(g => g.type === "Supplier");
  else if (f === "risk") filtered = filtered.filter(g => g.priority === "critical" || g.state === "Paused");
  else if (f === "unanswered") filtered = filtered.filter(g => g.unread > 0);
  else if (f === "auto") filtered = filtered.filter(g => g.state === "Auto-approved");
  else if (f === "paused") filtered = filtered.filter(g => g.state === "Paused");

  // Search
  if (delegateState.searchQuery) {
    const q = delegateState.searchQuery.toLowerCase();
    filtered = filtered.filter(g => g.name.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q));
  }

  container.innerHTML = filtered.map(g => `
    <div class="delegate-group-item ${g.id === delegateState.activeGroupId ? 'active' : ''}" onclick="selectDelegateGroup('${g.id}')">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span class="group-name"><i class="fa-solid ${g.avatarIcon}"></i> ${g.name}</span>
        <span class="group-time">${g.time}</span>
      </div>
      <div class="group-preview">${g.lastMsg}</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
        <span class="delegate-badge ${g.stateClass}">${g.state}</span>
        <div style="display:flex; gap:4px; align-items:center;">
          ${g.priority === 'critical' ? '<span class="risk-badge risk-critical"><i class="fa-solid fa-circle-exclamation"></i> QA Risk</span>' : ''}
          ${g.priority === 'high' ? '<span class="risk-badge risk-high">Needs Aditya</span>' : ''}
          ${g.unread > 0 ? `<span class="unread-pill">${g.unread}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function selectDelegateGroup(groupId) {
  delegateState.activeGroupId = groupId;
  renderDelegateGroups();
  renderDelegateChat();
  renderDelegateIntel();
}

function filterDelegateGroups(filterKey) {
  delegateState.groupFilter = filterKey;
  document.querySelectorAll(".group-filter-pill").forEach(el => el.classList.remove("active"));
  const btn = document.getElementById(`filter_${filterKey}`);
  if (btn) btn.classList.add("active");
  renderDelegateGroups();
}

function handleGroupSearch(q) {
  delegateState.searchQuery = q;
  renderDelegateGroups();
}

// RENDER CHAT THREAD (CENTRE COLUMN - WHATSAPP BUSINESS WEB SIMULATOR)
function renderDelegateChat() {
  const g = delegateState.groups.find(group => group.id === delegateState.activeGroupId);
  if (!g) return;

  const header = document.getElementById("chatHeaderArea");
  const thread = document.getElementById("chatThreadArea");

  // Determine group participants list string
  const memberList = g.membersList || `Aditya (Founder), Gaurav (Ops Head), ${g.name} Team, Adityam (AI Copilot)`;

  if (header) {
    header.innerHTML = `
      <div class="wa-header-bar">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div class="wa-header-avatar">
            <i class="fa-solid ${g.avatarIcon}"></i>
          </div>
          <div>
            <div style="font-weight:800; font-size:0.95rem; color:#ffffff; display:flex; align-items:center; gap:0.5rem;">
              ${g.name}
              <span style="font-size:0.65rem; background:rgba(255,255,255,0.2); color:#ffffff; padding:1px 6px; border-radius:4px; font-weight:600;">${g.type}</span>
            </div>
            <div class="wa-header-members" title="${memberList}">
              <i class="fa-solid fa-users" style="font-size:0.65rem;"></i> ${memberList}
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:0.75rem;">
          <!-- EXECUTIVE TOGGLE: FULL VS SIGNAL ONLY -->
          <div style="display:flex; gap:2px; background:rgba(0,0,0,0.25); padding:2px; border-radius:6px;">
            <button class="btn btn-xs ${!delegateState.signalOnly ? 'btn-primary' : 'btn-outline'}" onclick="toggleSignalOnly(false)" style="font-size:0.7rem; color:#fff; border-color:transparent;">Full Chat (${g.fullCount || g.messages.length})</button>
            <button class="btn btn-xs ${delegateState.signalOnly ? 'btn-primary' : 'btn-outline'}" onclick="toggleSignalOnly(true)" style="font-size:0.7rem; color:#fff; border-color:transparent;"><i class="fa-solid fa-filter"></i> Signal Only (${g.signalCount || 3})</button>
          </div>
          <i class="fa-solid fa-magnifying-glass" style="font-size:0.9rem; cursor:pointer; color:#ffffff; opacity:0.85;" title="Search in chat"></i>
          <i class="fa-solid fa-ellipsis-vertical" style="font-size:0.9rem; cursor:pointer; color:#ffffff; opacity:0.85;" title="Group settings"></i>
        </div>
      </div>
    `;
  }

  if (thread) {
    let msgs = g.messages;
    if (delegateState.signalOnly) {
      msgs = msgs.filter(m => m.isSignal || m.isDraft || m.isBot || m.isUser);
    }

    const compressedCount = g.messages.length - msgs.length;

    thread.className = "wa-chat-bg";
    thread.innerHTML = `
      <div class="wa-date-divider"><i class="fa-solid fa-lock" style="font-size:0.65rem;"></i> End-to-end encrypted &bull; Adityam AI Copilot Active</div>

      ${delegateState.signalOnly && compressedCount > 0 ? `
        <div class="noise-compressed-bar" onclick="toggleSignalOnly(false)" style="margin:4px auto; max-width:92%; cursor:pointer; font-size:0.775rem;">
          <i class="fa-solid fa-compress text-primary"></i> <strong>${compressedCount} routine messages compressed</strong> (greetings, 'noted', attendance). Click to expand full conversation.
        </div>
      ` : ''}

      ${msgs.map(m => {
        const isUser = m.isUser || (m.sender && (m.sender.includes("Aditya (") || m.sender === "Aditya"));
        const isBot = m.isBot;
        const bubbleClass = isBot ? 'wa-bubble-ai' : (isUser ? 'wa-bubble-outgoing' : 'wa-bubble-incoming');

        let senderColor = "#075e54";
        if (m.sender && m.sender.includes("Gaurav")) senderColor = "#16a34a";
        else if (m.sender && (m.sender.includes("Vikram") || m.sender.includes("QA"))) senderColor = "#d97706";
        else if (m.sender && (m.sender.includes("Customer") || m.sender.includes("Mark") || m.sender.includes("Sarah") || m.sender.includes("Ahmed"))) senderColor = "#2563eb";
        else if (m.sender && m.sender.includes("Aditya")) senderColor = "#174a70";

        return `
          <div class="wa-bubble ${bubbleClass} ${m.isDraft ? 'draft-bubble' : ''}">
            ${!isUser ? `
              <div class="wa-sender-name" style="color:${senderColor};">
                ${m.sender}
                ${isBot ? '<span style="font-size:0.65rem; background:#dcfce7; color:#166534; padding:1px 5px; border-radius:3px; margin-left:6px;"><i class="fa-solid fa-robot"></i> Adityam AI</span>' : ''}
              </div>
            ` : ''}

            <div style="font-size:0.85rem; color:#111b21; margin-top:2px;">
              ${m.text}
            </div>

            ${m.attachment ? `
              <div class="bubble-attachment" onclick="previewSourceDoc('${m.attachment}')" style="margin-top:6px; background:rgba(0,0,0,0.05); padding:6px 10px; border-radius:6px; font-size:0.775rem;">
                <i class="fa-solid fa-file-pdf text-danger" style="font-size:1.05rem;"></i> <span>Document Attachment: <strong>${m.attachment}</strong></span>
              </div>
            ` : ''}

            ${isBot && !m.isDraft ? `
              <div class="bot-disclosure-tag" style="margin-top:6px; font-size:0.675rem; color:#166534; font-weight:700;">
                <i class="fa-solid fa-robot"></i> ${g.state === 'Auto-approved' ? 'Sent automatically by Adityam under Approved Documents policy' : 'Sent for Aditya by Adityam'}
              </div>
            ` : ''}

            ${m.isDraft ? `
              <div class="draft-badge-bar" style="margin-top:8px; padding-top:6px; border-top:1px dashed #d97706; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.75rem; color:#d97706; font-weight:700;"><i class="fa-solid fa-pen-ruler"></i> Draft held for Aditya approval</span>
                <button class="btn btn-xs btn-primary" onclick="openApproveModal('${g.id}')"><i class="fa-solid fa-check"></i> Approve & Send</button>
              </div>
            ` : ''}

            <div class="wa-msg-meta">
              <span>${m.time}</span>
              ${isUser ? '<span class="wa-tick-blue">✓✓</span>' : ''}
            </div>
          </div>
        `;
      }).join('')}
    `;

    // Input Bar Area
    let inputBarWrapper = document.getElementById("waInputBarWrapper");
    if (!inputBarWrapper) {
      inputBarWrapper = document.createElement("div");
      inputBarWrapper.id = "waInputBarWrapper";
      if (thread.parentNode) thread.parentNode.appendChild(inputBarWrapper);
    }

    inputBarWrapper.innerHTML = `
      <div class="wa-input-bar">
        <button class="btn btn-sm btn-outline" style="border:none; color:#54656f;" title="Emoji"><i class="fa-regular fa-face-smile" style="font-size:1.2rem;"></i></button>
        <button class="btn btn-sm btn-outline" style="border:none; color:#54656f;" title="Attach File" onclick="alert('Synthetic Attachment Demo: Pick any material cert or quality drawing from the Sources panel.')"><i class="fa-solid fa-paperclip" style="font-size:1.1rem;"></i></button>
        <input type="text" class="wa-input-field" id="waMessageInput" placeholder="Type a message as Aditya in ${g.name}..." onkeypress="handleWaInputKeyPress(event)">
        <button class="wa-send-btn" onclick="sendWaMessage()" title="Send Message as Aditya"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;

    setTimeout(() => { thread.scrollTop = thread.scrollHeight; }, 50);
  }
}

function handleWaInputKeyPress(e) {
  if (e.key === "Enter") sendWaMessage();
}

function sendWaMessage() {
  const input = document.getElementById("waMessageInput");
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const g = delegateState.groups.find(group => group.id === delegateState.activeGroupId);
  if (!g) return;

  const newMsg = {
    id: "m_user_" + Date.now(),
    sender: "Aditya (BLW Founder)",
    text: val,
    time: "Just now",
    isHuman: true,
    isSignal: true,
    isUser: true
  };

  g.messages.push(newMsg);
  g.fullCount = (g.fullCount || g.messages.length) + 1;
  g.signalCount = (g.signalCount || 3) + 1;
  input.value = "";
  renderDelegateChat();

  showDelegateToast(`💬 Sent WhatsApp message as Aditya in ${g.name}`);

  // Simulated auto-reply after 1.2s
  setTimeout(() => {
    const isBotReply = Math.random() > 0.4;
    const replySender = isBotReply ? "Adityam (AI Copilot)" : "Gaurav (Operations Head)";
    const replyText = isBotReply 
      ? `Received Aditya. Adityam has logged this in the BLW export triage log and notified the concerned department.`
      : `Noted Aditya. Gaurav and the team are reviewing this now.`;

    g.messages.push({
      id: "m_reply_" + Date.now(),
      sender: replySender,
      text: replyText,
      time: "Just now",
      isHuman: !isBotReply,
      isBot: isBotReply,
      isSignal: true
    });
    renderDelegateChat();
  }, 1200);
}

function toggleSignalOnly(val) {
  delegateState.signalOnly = val;
  renderDelegateChat();
}

// RENDER ADITYAM INTELLIGENCE PANEL (RIGHT COLUMN)
function renderDelegateIntel() {
  const g = delegateState.groups.find(group => group.id === delegateState.activeGroupId);
  if (!g) return;

  const intel = g.intel || {};
  const container = document.getElementById("delegateIntelPanelBody");
  if (!container) return;

  // Active Tab Highlight
  document.querySelectorAll(".intel-tab-btn").forEach(btn => btn.classList.remove("active"));
  const activeTabBtn = document.getElementById(`tabIntel_${delegateState.activeIntelTab}`);
  if (activeTabBtn) activeTabBtn.classList.add("active");

  if (delegateState.activeIntelTab === "brief") {
    container.innerHTML = `
      <div class="intel-card">
        <h4 class="intel-section-title"><i class="fa-solid fa-brain text-primary"></i> Situation Brief</h4>
        <p style="font-size:0.85rem; color:var(--text-main); line-height:1.5;">${intel.brief}</p>
        <div style="display:flex; justify-content:space-between; margin-top:0.75rem; font-size:0.75rem;">
          <span>Risk: <strong style="color:${g.priority === 'critical' ? '#ef4444' : '#d97706'};">${intel.risk}</strong></span>
          <span>Confidence: <strong class="text-success">${intel.confidence}</strong></span>
        </div>
      </div>

      <div class="intel-card">
        <h4 class="intel-section-title"><i class="fa-solid fa-gavel text-warning"></i> Key Decision Required</h4>
        <p style="font-size:0.85rem; font-weight:700; color:var(--text-main);">${intel.decisionNeeded}</p>
      </div>

      ${g.id === 'g9' ? `
        <div class="intel-card" style="border-color:#ef4444; background:rgba(239, 68, 68, 0.05);">
          <h4 class="intel-section-title" style="color:#ef4444;"><i class="fa-solid fa-shield-halved"></i> Safety Boundary Enforced</h4>
          <p style="font-size:0.8rem; color:var(--text-muted);">Human approval required because this is a customer quality complaint. Automatic customer responses paused.</p>
        </div>
      ` : ''}

      ${g.id === 'g10' ? `
        <div class="intel-card" style="border-color:#10b981; background:rgba(16, 185, 129, 0.05);">
          <h4 class="intel-section-title" style="color:#10b981;"><i class="fa-solid fa-check-circle"></i> Autonomy Granted</h4>
          <p style="font-size:0.8rem; color:var(--text-muted);">Sent automatically under 'Approved Documents' policy. Matched approved part family without pricing risk.</p>
          <button class="btn btn-xs btn-outline-danger" onclick="revokeAutonomy('${g.id}')"><i class="fa-solid fa-ban"></i> Revoke this automation</button>
        </div>
      ` : ''}
    `;
  } else if (delegateState.activeIntelTab === "reply") {
    container.innerHTML = `
      <div class="intel-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <h4 class="intel-section-title" style="margin:0;"><i class="fa-solid fa-feather text-primary"></i> Suggested Reply</h4>
          <span class="status-badge st-demonstrated" style="font-size:0.65rem;">Style Match: 87%</span>
        </div>

        ${intel.suggestedReply ? `
          <div class="suggested-reply-box" id="suggestedReplyText">
            "${intel.suggestedReply}"
          </div>

          <div style="display:flex; gap:0.4rem; margin:0.75rem 0; flex-wrap:wrap;">
            <button class="btn btn-xs btn-outline" onclick="adjustReplyTone('Direct')">Direct</button>
            <button class="btn btn-xs btn-outline" onclick="adjustReplyTone('Warm')">Warm</button>
            <button class="btn btn-xs btn-outline" onclick="adjustReplyTone('Formal')">Formal</button>
            <button class="btn btn-xs btn-outline" onclick="adjustReplyTone('Concise')">Shorten</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:1rem;">
            <button class="btn btn-primary btn-sm btn-full" onclick="openApproveModal('${g.id}')"><i class="fa-solid fa-paper-plane"></i> Approve & Send</button>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn btn-outline btn-xs btn-full" onclick="openEditReplyModal('${g.id}')"><i class="fa-solid fa-pen"></i> Edit reply</button>
              <button class="btn btn-secondary btn-xs btn-full" onclick="openDelegateModal('${g.id}')"><i class="fa-solid fa-user-plus"></i> Delegate</button>
            </div>
          </div>
        ` : `
          <p style="font-size:0.825rem; color:var(--text-muted);">No reply suggested. Group is in Observing mode or no direct question pending.</p>
        `}
      </div>
    `;
  } else if (delegateState.activeIntelTab === "actions") {
    container.innerHTML = `
      <div class="intel-card">
        <h4 class="intel-section-title"><i class="fa-solid fa-bolt text-primary"></i> Operational Actions</h4>
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
          ${g.id === 'g9' ? `
            <button class="btn btn-primary btn-sm" onclick="openApproveModal('${g.id}')"><i class="fa-solid fa-check"></i> Approve acknowledgement</button>
            <button class="btn btn-outline btn-sm" onclick="alert('QA Head Vikram M. assigned to incident QI-DEMO-1042.')"><i class="fa-solid fa-user-gear"></i> Assign QA Head</button>
            <button class="btn btn-secondary btn-sm" onclick="alert('Incident QI-DEMO-1042 opened in quality tracker.')"><i class="fa-solid fa-folder-plus"></i> Open incident</button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="openApproveModal('${g.id}')"><i class="fa-solid fa-check"></i> Approve & send reply</button>
            <button class="btn btn-outline btn-sm" onclick="openDelegateModal('${g.id}')"><i class="fa-solid fa-share"></i> Delegate to Sales Lead</button>
          `}
        </div>
      </div>
    `;
  } else if (delegateState.activeIntelTab === "sources") {
    container.innerHTML = `
      <div class="intel-card">
        <h4 class="intel-section-title"><i class="fa-solid fa-link text-primary"></i> Provenance & Sources</h4>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.75rem;">Every fact in Adityam's draft is verified against operational records. Customer data is strictly isolated.</p>
        <div>
          ${(intel.sources || []).map(s => `
            <div class="source-chip" onclick="previewSourceDoc('${s}')">
              <i class="fa-solid fa-database text-primary"></i>
              <span>${s}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (delegateState.activeIntelTab === "audit") {
    container.innerHTML = `
      <div class="intel-card">
        <h4 class="intel-section-title"><i class="fa-solid fa-clock-rotate-left text-primary"></i> Audit Trail</h4>
        <div style="font-size:0.75rem; font-family:var(--font-mono); display:flex; flex-direction:column; gap:0.5rem;">
          ${(intel.audit || ['No actions recorded']).map(a => `
            <div style="padding:6px; background:var(--bg-subtle); border-radius:4px; border-left:2px solid var(--accent-primary);">
              ${a}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

function setIntelTab(tabKey) {
  delegateState.activeIntelTab = tabKey;
  renderDelegateIntel();
}

// APPROVE & SEND SIMULATION DIALOG
function openApproveModal(groupId) {
  const g = delegateState.groups.find(group => group.id === groupId);
  if (!g) return;

  const modal = document.getElementById("delegateApproveModal");
  if (!modal) {
    alert(`SIMULATED ACTION: Approved & Sent reply for ${g.name}.\n\nMessage appended to conversation labeled "Sent for Aditya by Adityam".`);
    confirmSimulatedSend(groupId);
    return;
  }
  
  document.getElementById("approveGroupName").innerText = g.name;
  document.getElementById("approveDraftText").innerText = g.intel.suggestedReply || "Confirms timeline update.";
  modal.classList.add("open");
}

function closeApproveModal() {
  const modal = document.getElementById("delegateApproveModal");
  if (modal) modal.classList.remove("open");
}

function confirmSimulatedSend(groupId) {
  closeApproveModal();
  const targetId = groupId || delegateState.activeGroupId;
  const g = delegateState.groups.find(group => group.id === targetId);
  if (!g) return;

  // Append message to thread
  g.messages.push({
    id: "m_sent_" + Date.now(),
    sender: "Adityam AI (for Aditya)",
    text: g.intel.suggestedReply || "Confirmed.",
    time: "Just now",
    isBot: true,
    isSignal: true
  });

  g.state = "Supervised";
  g.stateClass = "st-supervised";
  g.priority = "low";
  g.unread = 0;
  g.intel.audit.unshift(`Just now • Human approved & sent by Aditya`);

  renderDelegateGroups();
  renderDelegateChat();
  renderDelegateIntel();

  // Toast notification
  showDelegateToast(`✅ Reply sent successfully for ${g.name} (Simulated Send)`);
}

function adjustReplyTone(tone) {
  const box = document.getElementById("suggestedReplyText");
  if (!box) return;
  if (tone === "Direct") box.innerText = `"420 pieces dispatch Friday. Balance 180 dispatch Saturday post-inspection. Please confirm partial shipment approval."`;
  else if (tone === "Warm") box.innerText = `"Hi team, we've completed 420 pieces and can gladly dispatch those on Friday to keep your line running! The remaining 180 will finish Saturday morning. Let us know if this works for you."`;
  else if (tone === "Formal") box.innerText = `"We hereby confirm 420 pieces are cleared for Friday dispatch. The remaining 180 pieces are scheduled for final inspection clearance on Saturday 08:00 AM."`;
  else if (tone === "Concise") box.innerText = `"420 ready Friday. 180 ready Saturday morning. Please confirm partial Friday dispatch."`;
}

// SOURCE PREVIEW DRAWER
function previewSourceDoc(sourceTitle) {
  const s = DELEGATE_SOURCES[sourceTitle] || {
    title: sourceTitle,
    type: "Synthetic Operational Record",
    updated: "Today",
    scope: "Internal Scope",
    fact: "Sample operational data verified for Adityam intelligence reasoning."
  };

  alert(`📄 DELEGATE PROVENANCE SOURCE PREVIEW\n\nTitle: ${s.title}\nType: ${s.type}\nUpdated: ${s.updated}\nAccess Scope: ${s.scope}\n\nExtracted Fact:\n"${s.fact}"\n\nNote: Customer data isolation strictly enforced. No cross-customer access permitted.`);
}

// DELEGATE TASK MODAL
function openDelegateModal(groupId) {
  const g = delegateState.groups.find(group => group.id === groupId);
  alert(`📋 DELEGATE TASK TO TEAM\n\nGroup: ${g ? g.name : 'Active Group'}\nAssigned To: Export Sales Team (Rajesh V.)\nTask: Follow up on customer requirement and update delivery schedule.\n\nStatus: Task created in internal workflow queue.`);
}

function openEditReplyModal(groupId) {
  const g = delegateState.groups.find(group => group.id === groupId);
  const current = g && g.intel ? g.intel.suggestedReply : "";
  const updated = prompt("Edit Suggested Reply for Aditya:", current);
  if (updated !== null && g && g.intel) {
    g.intel.suggestedReply = updated;
    renderDelegateIntel();
    renderDelegateChat();
  }
}

// GLOBAL CONTROLS
function togglePauseDelegate() {
  delegateState.isPaused = !delegateState.isPaused;
  const btn = document.getElementById("btnPauseDelegate");
  const banner = document.getElementById("delegatePausedBanner");

  if (delegateState.isPaused) {
    if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> Resume Delegate`;
    if (banner) banner.style.display = "flex";
    showDelegateToast("⏸ Delegate has been PAUSED. Automated actions & drafts suspended.");
  } else {
    if (btn) btn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause Delegate`;
    if (banner) banner.style.display = "none";
    showDelegateToast("▶ Delegate is ACTIVE. Monitoring authorized conversations.");
  }
}

function resetDelegateDemo() {
  delegateState.groups = JSON.parse(JSON.stringify(DELEGATE_GROUPS));
  delegateState.activeGroupId = "g8";
  delegateState.signalOnly = true;
  delegateState.isPaused = false;
  renderDelegateBriefing();
  renderDelegateGroups();
  renderDelegateChat();
  renderDelegateIntel();
  showDelegateToast("🔄 Delegate demo state reset to initial morning briefing.");
}

function openAdityaStyleProfile() {
  const modal = document.getElementById("adityaStyleModal");
  if (modal) modal.classList.add("open");
  else alert("👑 ADITYA STYLE PROFILE\n\nStyle Match: 87%\nReviewed Drafts: 84\nApproved without edit: 68\n\nGuidelines:\n- Concise & decisive\n- Professional but warm with customers\n- Never promise unconfirmed dates\n- English for external, Hinglish for internal");
}

function closeAdityaStyleProfile() {
  const modal = document.getElementById("adityaStyleModal");
  if (modal) modal.classList.remove("open");
}

function openAutomationRulesModal() {
  const modal = document.getElementById("automationRulesModal");
  if (modal) modal.classList.add("open");
  else alert("⚙️ AUTOMATION RULES & AUTONOMY BOUNDARIES\n\nPermitted Auto-Actions:\n- Approved Document Delivery (Active)\n- Order Tracking Link Dispatch (Active)\n\nStrictly Prohibited Auto-Actions:\n- Pricing & Discount Negotiation\n- Delivery Commitments\n- Quality Liability Statements");
}

function closeAutomationRulesModal() {
  const modal = document.getElementById("automationRulesModal");
  if (modal) modal.classList.remove("open");
}

function revokeAutonomy(groupId) {
  const g = delegateState.groups.find(group => group.id === groupId);
  if (g) {
    g.state = "Supervised";
    g.stateClass = "st-supervised";
    renderDelegateGroups();
    renderDelegateIntel();
    showDelegateToast(`🛑 Automation revoked for ${g.name}. Group switched to Supervised mode.`);
  }
}

// GUIDED DEMO TOUR STEPPER OVERLAY
function startGuidedDemoTour() {
  delegateState.isTourActive = true;
  delegateState.tourStep = 1;
  showTourStepUI();
}

function nextTourStep() {
  if (delegateState.tourStep < 5) {
    delegateState.tourStep++;
    showTourStepUI();
  } else {
    endGuidedDemoTour();
  }
}

function endGuidedDemoTour() {
  delegateState.isTourActive = false;
  const overlay = document.getElementById("guidedTourOverlay");
  if (overlay) overlay.style.display = "none";
}

function showTourStepUI() {
  const overlay = document.getElementById("guidedTourOverlay");
  if (!overlay) return;

  const steps = [
    { title: "Step 1: 186 Messages Became 7 Decisions", text: "Delegate reviews all authorized BLW WhatsApp groups and extracts only what requires Aditya's attention.", action: () => setDelegateViewMode("briefing") },
    { title: "Step 2: Signal Only Noise Compression", text: "In any thread, click 'Signal Only' to hide greetings and 'noted' chatter, keeping only key facts and decisions.", action: () => { setDelegateViewMode("workspace"); selectDelegateGroup("g2"); } },
    { title: "Step 3: Source-Backed Suggested Replies", text: "Adityam drafts responses in Aditya's style and backs every fact with operational sources (Production Board, QA Plan).", action: () => selectDelegateGroup("g8"); },
    { title: "Step 4: Safety & Risk Boundaries", text: "High-risk messages (Quality complaints, delivery commitments) are held for human approval. Low-risk document requests are handled safely.", action: () => selectDelegateGroup("g9"); },
    { title: "Step 5: Full Control & Audit Trail", text: "Aditya retains complete control with Approve, Edit, Delegate, Pause, and complete Audit timeline visibility.", action: () => setIntelTab("audit"); }
  ];

  const current = steps[delegateState.tourStep - 1];
  if (current.action) current.action();

  document.getElementById("tourStepTitle").innerText = current.title;
  document.getElementById("tourStepText").innerText = current.text;
  document.getElementById("tourStepIndicator").innerText = `Step ${delegateState.tourStep} of 5`;

  overlay.style.display = "flex";
}

function showDelegateToast(msg) {
  const toast = document.createElement("div");
  toast.className = "delegate-toast";
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
