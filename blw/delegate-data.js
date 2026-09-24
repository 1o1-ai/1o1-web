/* DELEGATE MOCK UI - SYNTHETIC DATA FIXTURES
 * Category: KAI247 -> SMB | Service: Delegate | Assistant: Adityam
 * Mandatory Notice: Interactive product mock • Synthetic BLW conversations • No live WhatsApp connection
 */

const DELEGATE_BRIEFING = {
  greeting: "Good morning, Aditya",
  summary: "Delegate reviewed 186 messages across 12 groups since your last visit. Only 7 need your attention.",
  metrics: {
    reviewed: 186,
    compressed: 129,
    questions: 21,
    handled: 14,
    needsAditya: 7,
    commitmentsDue: 5,
    highRisk: 2,
    timeSavedMin: 74
  },
  priorityCards: [
    {
      id: "p1",
      groupId: "g8",
      groupName: "Customer — Apex Mobility OEM",
      type: "Commercial Commitment",
      urgency: "high",
      title: "Delivery commitment requested",
      desc: "Apex Mobility OEM asks whether 600 exhaust valves can ship Friday. Production confirms 420 complete; remaining 180 are forecast for Saturday.",
      actionLabel: "Review reply",
      secondaryAction: "Ask Production",
      delegateAction: "Delegate to Sales"
    },
    {
      id: "p2",
      groupId: "g9",
      groupName: "Customer — NorthStar Engines",
      type: "Quality Complaint",
      urgency: "critical",
      title: "Quality complaint — immediate acknowledgement needed",
      desc: "NorthStar Engines uploaded a photograph and reports stem-diameter variation on 5 parts in Lot EV-881.",
      actionLabel: "Review acknowledgement",
      secondaryAction: "Open incident",
      delegateAction: "Assign QA Head"
    },
    {
      id: "p3",
      groupId: "g6",
      groupName: "Sales & RFQ Desk",
      type: "Drawing Mismatch",
      urgency: "medium",
      title: "Drawing revision missing",
      desc: "Sales received an RFQ for Pulsar 220 valves, but the attached drawing is Rev C while the message specifies Rev D.",
      actionLabel: "Request correct drawing",
      secondaryAction: "Assign Sales",
      delegateAction: "Delegate"
    },
    {
      id: "p4",
      groupId: "g11",
      groupName: "Supplier — Alloy Steel Program",
      type: "Supply Delay Risk",
      urgency: "medium",
      title: "Supplier delay may affect Batch EV-2409",
      desc: "Alloy-steel raw bar stock delivery moved by two days. Assistant linked affected production batch EV-2409.",
      actionLabel: "View impact",
      secondaryAction: "Ask Procurement",
      delegateAction: "Notify Production"
    }
  ],
  digest: [
    { time: "08:42 AM", group: "Customer — Meridian Spares", text: "Material Certificate MC-DEMO-77 sent automatically under 'Approved Documents' policy." },
    { time: "08:15 AM", group: "Plant Operations — Daily", text: "Compressed 18 routine attendance & acknowledgement messages into 6 signal items." },
    { time: "07:50 AM", group: "Dispatch & Logistics", text: "Consignment DR-DEMO-551 tracking link updated automatically for Customer." },
    { time: "07:30 AM", group: "Quality & Inspection", text: "Paused automatic replies following QA alert; assigned QA Lead Vikram M." }
  ]
};

const DELEGATE_GROUPS = [
  {
    id: "g1",
    name: "BLW Leadership Circle",
    type: "Leadership",
    state: "Observing",
    stateClass: "st-observing",
    topic: "Monthly operating review and capital approval",
    avatarIcon: "fa-users-gear",
    unread: 0,
    priority: "low",
    lastMsg: "P&L report draft circulated for review.",
    time: "Yesterday",
    participants: 6,
    signalCount: 3,
    fullCount: 8,
    intel: {
      brief: "Leadership team reviewing Q3 capital expenditure proposal for new LCN nitriding furnace line.",
      risk: "Low Risk — Internal Discussion",
      confidence: "High",
      decisionNeeded: "No immediate decision required today.",
      suggestedReply: "",
      sources: ["Q3 CapEx Proposal Rev 2", "Operating Budget FY26"],
      audit: ["06:00 PM Yesterday • Assistant observed chat", "No automated actions taken"]
    },
    messages: [
      { id: "m101", sender: "Managing Director", text: "Good morning team. Please review the furnace CapEx proposal before Thursday.", time: "Yesterday 04:30 PM", isHuman: true },
      { id: "m102", sender: "VP Finance", text: "Financial payback model looks solid at 14 months based on current export volumes.", time: "Yesterday 05:10 PM", isHuman: true },
      { id: "m103", sender: "Plant Head", text: "Noted. Maintenance team confirmed space allocation in Shop Floor 3.", time: "Yesterday 05:40 PM", isHuman: true, isRoutine: true },
      { id: "m104", sender: "Aditya", text: "Let's discuss ROI during Wednesday operating review.", time: "Yesterday 06:00 PM", isHuman: true }
    ]
  },
  {
    id: "g2",
    name: "Plant Operations — Daily",
    type: "Internal Operations",
    state: "Supervised",
    stateClass: "st-supervised",
    topic: "Production throughput and manpower",
    avatarIcon: "fa-industry",
    unread: 3,
    priority: "medium",
    lastMsg: "Machine 4 stopped at 8:10 AM. Overtime approval requested.",
    time: "08:15 AM",
    participants: 14,
    signalCount: 6,
    fullCount: 24,
    intel: {
      brief: "Machine 4 spindle sensor fault caused 3-hour downtime affecting Batch EV-2409. Plant Lead requests overtime approval to recover output by 2:00 PM.",
      risk: "Medium Risk — Overtime Decision",
      confidence: "High",
      decisionNeeded: "Approve 2-hour shift extension for Line 1 operators.",
      suggestedReply: "Approved for 2 hours overtime on Line 1 today to recover Batch EV-2409. Please ensure Maintenance completes spindle calibration check by 11:30 AM.",
      sources: ["Maintenance Maintenance Log #M-882", "Production Target Board Line 1"],
      audit: [
        "08:10 AM • Machine 4 fault logged",
        "08:15 AM • 18 routine chatter messages compressed into 6 signal points",
        "08:20 AM • Drafted overtime approval recommendation for Aditya"
      ]
    },
    messages: [
      { id: "m201", sender: "Shift Supervisor", text: "Good morning everyone. Shift A attendance is 96%.", time: "07:30 AM", isHuman: true, isRoutine: true },
      { id: "m202", sender: "Line 1 Lead", text: "Good morning. Line 1 running Pulsar 220 intake valves.", time: "07:32 AM", isHuman: true, isRoutine: true },
      { id: "m203", sender: "Operator K.", text: "Noted 👍", time: "07:33 AM", isHuman: true, isRoutine: true },
      { id: "m204", sender: "Operator R.", text: "Received 👍", time: "07:35 AM", isHuman: true, isRoutine: true },
      { id: "m205", sender: "Line 1 Lead", text: "ALERT: Machine 4 stopped at 8:10 AM due to spindle sensor error code E-402.", time: "08:10 AM", isHuman: true, isSignal: true },
      { id: "m206", sender: "Maintenance Lead", text: "Maintenance team arrived at Machine 4. Replacing proximity sensor.", time: "08:12 AM", isHuman: true, isSignal: true },
      { id: "m207", sender: "Maintenance Lead", text: "Expected restart time: 11:30 AM.", time: "08:14 AM", isHuman: true, isSignal: true },
      { id: "m208", sender: "Plant Operations Head", text: "Batch EV-2409 will lose 3 hours. Requesting Aditya's approval for 2 hours overtime today to recover.", time: "08:15 AM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g3",
    name: "Production Line 1 — Exhaust Valves",
    type: "Internal Production",
    state: "Supervised",
    stateClass: "st-supervised",
    topic: "Heat-treatment delay affecting Batch EV-2409",
    avatarIcon: "fa-gears",
    unread: 1,
    priority: "medium",
    lastMsg: "Furnace temperature stabilized. Batch EV-2409 resuming.",
    time: "09:10 AM",
    participants: 8,
    signalCount: 4,
    fullCount: 11,
    intel: {
      brief: "Nitrex Furnace 2 temp drop delayed nitriding cycle by 90 minutes. Batch EV-2409 completion rescheduled to Saturday 8:00 AM.",
      risk: "Medium Risk — Schedule Variance",
      confidence: "High",
      decisionNeeded: "Confirm customer dispatch timeline adjustments.",
      suggestedReply: "Noted. Prioritize Batch EV-2409 inspection immediately after Saturday furnace unloading.",
      sources: ["Furnace 2 Telemetry Log", "Batch EV-2409 Production Card"],
      audit: ["09:10 AM • Heat-treatment delay correlated with Apex Mobility order"]
    },
    messages: [
      { id: "m301", sender: "Heat Treat Lead", text: "Furnace 2 temp dipped by 15°C during pre-heating. Cycle paused.", time: "08:30 AM", isHuman: true, isSignal: true },
      { id: "m302", sender: "QC Inspector", text: "Do not unload batch until pyrometer calibration is verified.", time: "08:45 AM", isHuman: true, isSignal: true },
      { id: "m303", sender: "Heat Treat Lead", text: "Furnace temp stabilized. Batch EV-2409 resuming now. Completion moved to Sat 8:00 AM.", time: "09:10 AM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g4",
    name: "Quality & Inspection",
    type: "Internal Quality",
    state: "Paused",
    stateClass: "st-paused",
    topic: "Dimensional deviation requiring QA review",
    avatarIcon: "fa-microscope",
    unread: 2,
    priority: "high",
    lastMsg: "Sample 4 stem diameter measured +0.003mm over upper spec limit.",
    time: "09:25 AM",
    participants: 10,
    signalCount: 3,
    fullCount: 9,
    intel: {
      brief: "VMM optical inspection flagged 0.003mm stem diameter deviation on 5 sample valves from Lot EV-881. Adityam automatically paused auto-replies for this group.",
      risk: "High Risk — Quality Deviation",
      confidence: "High",
      decisionNeeded: "Assign QA Manager to perform 100% sorting & CMM re-calibration.",
      suggestedReply: "Hold Lot EV-881 in quarantine. QA Manager to inspect grinding wheel dressing and report back by 1:00 PM.",
      sources: ["VMM Inspection Log #VMM-904", "BLW Valve Spec Sheet EV-AP180"],
      audit: [
        "09:25 AM • Dimensional anomaly detected",
        "09:25 AM • Assistant state automatically switched to PAUSED",
        "09:26 AM • Incident QA-DEMO-904 flagged for human review"
      ]
    },
    messages: [
      { id: "m401", sender: "VMM Inspector", text: "ALERT: Lot EV-881 sample 4 stem diameter measured 6.983mm (Upper Spec Limit: 6.980mm).", time: "09:20 AM", isHuman: true, isSignal: true },
      { id: "m402", sender: "QA Manager", text: "Lock Lot EV-881 in Red Bin. Re-checking grinding machine 2 dressing.", time: "09:25 AM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g5",
    name: "Dispatch & Logistics Stream",
    type: "Internal Logistics",
    state: "Auto-approved",
    stateClass: "st-auto",
    topic: "Export shipment tracking and container dispatch",
    avatarIcon: "fa-truck-fast",
    unread: 0,
    priority: "low",
    lastMsg: "Tracking link generated and sent to customer automatically.",
    time: "07:50 AM",
    participants: 7,
    signalCount: 3,
    fullCount: 6,
    intel: {
      brief: "Export shipment DR-DEMO-551 (3,000 sets Boxer BM150 valves) departed plant on container truck MH-04-CG-9041.",
      risk: "Low Risk — Routine Dispatch",
      confidence: "High",
      decisionNeeded: "Auto-tracking active. No manual action required.",
      suggestedReply: "",
      sources: ["Dispatch Record DR-DEMO-551", "Container GPS Telemetry"],
      audit: [
        "07:50 AM • Truck departure confirmed",
        "07:50 AM • Tracking link automatically generated & shared by Adityam under Auto-approve policy"
      ]
    },
    messages: [
      { id: "m501", sender: "Logistics Lead", text: "Container MH-04-CG-9041 loaded with 30 cases (DR-DEMO-551). Seal #BLW-9901.", time: "07:45 AM", isHuman: true, isSignal: true },
      { id: "m502", sender: "Adityam", text: "Sent automatically under 'Tracking Updates' policy: Generated GPS live tracking link for Consignment DR-DEMO-551 and notified customer.", time: "07:50 AM", isBot: true, isSignal: true },
      { id: "m503", sender: "Logistics Lead", text: "Thanks Adityam. Driver departed plant at 07:50 AM.", time: "07:52 AM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g6",
    name: "Sales & RFQ Desk",
    type: "Internal Sales",
    state: "Supervised",
    stateClass: "st-supervised",
    topic: "New RFQ missing drawing revision",
    avatarIcon: "fa-file-invoice-dollar",
    unread: 1,
    priority: "medium",
    lastMsg: "RFQ-9042 drawing attached is Rev C, but text specifies Rev D.",
    time: "08:50 AM",
    participants: 9,
    signalCount: 3,
    fullCount: 7,
    intel: {
      brief: "Inquiry RFQ-9042 for Pulsar 220 valves contains drawing Rev C, but customer email specifies Rev D stem groove detail.",
      risk: "Medium Risk — Drawing Mismatch",
      confidence: "High",
      decisionNeeded: "Request correct Rev D CAD drawing from buyer before quoting.",
      suggestedReply: "Please request customer engineering to send drawing Rev D. We cannot issue technical pricing on mismatched drawing revisions.",
      sources: ["Customer RFQ Attachment #RFQ-9042", "BLW Revision Index"],
      audit: ["08:50 AM • Drawing revision discrepancy flagged by Adityam"]
    },
    messages: [
      { id: "m601", sender: "Sales Executive", text: "Received RFQ-9042 from EuroMotives for 2,000 sets intake valves.", time: "08:40 AM", isHuman: true, isSignal: true },
      { id: "m602", sender: "Sales Executive", text: "PDF drawing attached is Rev C, but their email notes specify Rev D stem groove.", time: "08:50 AM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g7",
    name: "Finance & Collections",
    type: "Internal Finance",
    state: "Observing",
    stateClass: "st-observing",
    topic: "Overdue customer invoice; no automatic customer contact",
    avatarIcon: "fa-coins",
    unread: 0,
    priority: "medium",
    lastMsg: "Invoice #INV-9041 (Cairo Moto Parts) 5 days past due.",
    time: "Yesterday",
    participants: 5,
    signalCount: 2,
    fullCount: 5,
    intel: {
      brief: "Invoice #INV-9041 ($4,250) is 5 days past payment terms. Policy forbids automatic customer dunning.",
      risk: "Medium Risk — Overdue Payment",
      confidence: "High",
      decisionNeeded: "Sales Lead to call Ahmed Hassan (Cairo Moto Parts) during next account check.",
      suggestedReply: "",
      sources: ["Invoice #INV-9041 Record", "Credit Terms Agreement"],
      audit: ["Yesterday • Overdue alert observed; customer contact blocked by policy"]
    },
    messages: [
      { id: "m701", sender: "Finance Lead", text: "Invoice #INV-9041 for Cairo Moto Parts ($4,250) reached 35 days (Terms: 30 days).", time: "Yesterday 03:00 PM", isHuman: true, isSignal: true },
      { id: "m702", sender: "Aditya", text: "Rajesh will follow up during commercial call tomorrow.", time: "Yesterday 03:30 PM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g8",
    name: "Customer — Apex Mobility OEM",
    type: "Customer-facing",
    state: "Drafting",
    stateClass: "st-drafting",
    topic: "Request for Friday dispatch of a partially completed order",
    avatarIcon: "fa-building",
    unread: 2,
    priority: "high",
    lastMsg: "Can you confirm all 600 pieces will dispatch this Friday?",
    time: "10:35 AM",
    participants: 5,
    signalCount: 3,
    fullCount: 8,
    intel: {
      brief: "Customer Purchase Manager asks for firm Friday dispatch commitment of 600 pieces exhaust valves. Production data confirms 420 pieces ready; 180 finish final inspection Saturday.",
      risk: "Commercial Commitment — Approval Required",
      confidence: "High",
      decisionNeeded: "Approve proposed partial Friday dispatch (420 pcs) with balance Saturday.",
      suggestedReply: "We have completed 420 pieces and can dispatch those on Friday. The remaining 180 are scheduled to complete final inspection on Saturday morning. Please confirm whether a partial Friday dispatch would support your line plan, and we will prioritize the balance immediately after clearance.",
      sources: [
        "Production Board • Batch EV-2409 • updated 10:42 AM",
        "QA Plan • Final inspection scheduled Saturday 8:00 AM"
      ],
      audit: [
        "10:35 AM • Customer message received",
        "10:36 AM • Linked to Batch EV-2409 & QA Plan",
        "10:37 AM • Draft reply generated; held for Aditya approval (Commercial Commitment Policy)"
      ]
    },
    messages: [
      { id: "m801", sender: "Customer Purchase Mgr (Apex)", text: "Hi Aditya & team, can you confirm all 600 pieces of exhaust valves (EV-P220) will dispatch this Friday? Our line plan depends on it.", time: "10:35 AM", isHuman: true, isSignal: true },
      { id: "m802", sender: "BLW Sales Executive", text: "Checking with production team right now.", time: "10:38 AM", isHuman: true, isRoutine: true },
      { id: "m803", sender: "Adityam (Draft)", text: "[Draft Held for Approval] We have completed 420 pieces and can dispatch those on Friday. The remaining 180 finish inspection Saturday morning...", time: "10:40 AM", isBot: true, isDraft: true, isSignal: true }
    ]
  },
  {
    id: "g9",
    name: "Customer — NorthStar Engines",
    type: "Customer-facing",
    state: "Paused",
    stateClass: "st-paused",
    topic: "Quality complaint with inspection photograph",
    avatarIcon: "fa-triangle-exclamation",
    unread: 1,
    priority: "critical",
    lastMsg: "5 valves from Lot EV-881 appear outside stem-diameter tolerance.",
    time: "09:40 AM",
    participants: 4,
    signalCount: 2,
    fullCount: 5,
    intel: {
      brief: "Customer Quality Manager uploaded stem measurement photograph alleging 5 valves out of spec. Adityam prepared neutral acknowledgement and paused automatic messaging.",
      risk: "Customer Quality Complaint — Approval Required",
      confidence: "High",
      decisionNeeded: "Approve neutral acknowledgement & assign QA Head Vikram M.",
      suggestedReply: "Thank you for alerting us and for sharing the inspection image. Our Quality team has opened an urgent review. Please retain the affected pieces and share the lot number and measurement report if available. We will update you after the initial assessment.",
      sources: [
        "Photo Attachment • IMG_881_stem.jpg",
        "Quality Plan • Customer Complaint Protocol"
      ],
      audit: [
        "09:40 AM • Quality complaint image ingested",
        "09:41 AM • Created mock QA Incident QI-DEMO-1042",
        "09:41 AM • Group automation PAUSED under Quality Policy"
      ]
    },
    messages: [
      { id: "m901", sender: "Customer Quality Lead (NorthStar)", text: "Attached photo of stem diameter check. 5 pieces from Lot EV-881 measured 6.984mm vs 6.980mm max.", time: "09:40 AM", isHuman: true, isSignal: true, attachment: "IMG_881_stem.jpg" },
      { id: "m902", sender: "Adityam (Draft)", text: "[Draft Held for Approval] Thank you for alerting us and sharing the inspection image. Our Quality team has opened an urgent review...", time: "09:42 AM", isBot: true, isDraft: true, isSignal: true }
    ]
  },
  {
    id: "g10",
    name: "Customer — Meridian Spares",
    type: "Customer-facing",
    state: "Auto-approved",
    stateClass: "st-auto",
    topic: "Request for material certificate and catalogue",
    avatarIcon: "fa-file-shield",
    unread: 0,
    priority: "low",
    lastMsg: "Material Certificate MC-DEMO-77 sent automatically.",
    time: "08:42 AM",
    participants: 3,
    signalCount: 3,
    fullCount: 5,
    intel: {
      brief: "Customer requested approved Material Test Certificate for Bajaj Pulsar 220 valves. Adityam matched mock certificate MC-DEMO-77 and sent it automatically.",
      risk: "Low Risk — Approved Document Request",
      confidence: "High",
      decisionNeeded: "Automated under 'Approved Documents' policy.",
      suggestedReply: "",
      sources: ["Material Certificate MC-DEMO-77", "BLW Product Catalogue 2026"],
      audit: [
        "08:40 AM • Customer requested material certificate",
        "08:42 AM • Matched approved certificate MC-DEMO-77",
        "08:42 AM • Sent automatically under 'Approved Documents' policy by Adityam"
      ]
    },
    messages: [
      { id: "m1001", sender: "Meridian Procurement (Hans Weber)", text: "Please share the material certificate for Pulsar 220 valve batch shipped last week.", time: "08:40 AM", isHuman: true, isSignal: true },
      { id: "m1002", sender: "Adityam", text: "Sent automatically by Adityam under 'Approved Documents' policy: Attached Material Certificate MC-DEMO-77 (SUH3/21-4N LCN Nitrided depth 0.020mm).", time: "08:42 AM", isBot: true, isSignal: true, attachment: "MC-DEMO-77.pdf" },
      { id: "m1003", sender: "Meridian Procurement (Hans Weber)", text: "Received, thank you Adityam! Metallurgy specs match our QA requirements.", time: "08:45 AM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g11",
    name: "Supplier — Alloy Steel Program",
    type: "Supplier",
    state: "Supervised",
    stateClass: "st-supervised",
    topic: "Raw-material delivery moved by two days",
    avatarIcon: "fa-cubes-stacked",
    unread: 1,
    priority: "medium",
    lastMsg: "SUH3 12mm bar stock shipment delayed to Sept 28.",
    time: "08:20 AM",
    participants: 5,
    signalCount: 2,
    fullCount: 6,
    intel: {
      brief: "Supplier reports 2-day delay on SUH3 steel bar stock consignment. Impact linked to Batch EV-2409.",
      risk: "Medium Risk — Supply Chain Variance",
      confidence: "High",
      decisionNeeded: "Procurement to confirm buffer stock availability.",
      suggestedReply: "Please confirm dispatched truck LR number as soon as loaded on Sept 28.",
      sources: ["Supplier Dispatch Notice #SUP-881", "Buffer Inventory Report"],
      audit: ["08:20 AM • Supplier delay notice logged & linked to production planning by Adityam"]
    },
    messages: [
      { id: "m1101", sender: "Alloy Steel Logistics", text: "Dispatch of 5 Tons SUH3 12mm bar stock rescheduled from Sept 26 to Sept 28 due to mill annealing slot.", time: "08:20 AM", isHuman: true, isSignal: true }
    ]
  },
  {
    id: "g12",
    name: "Export — Europe Program",
    type: "Customer-facing Export",
    state: "Auto-approved",
    stateClass: "st-auto",
    topic: "Packing declaration and phytosanitary certificate request",
    avatarIcon: "fa-earth-europe",
    unread: 0,
    priority: "low",
    lastMsg: "ISPM-15 wooden pallet heat-treatment certificate dispatched automatically.",
    time: "07:15 AM",
    participants: 4,
    signalCount: 3,
    fullCount: 5,
    intel: {
      brief: "European distributor requested ISPM-15 heat-treatment phytosanitary packing certificate for Hamburg container. Adityam matched certified PDF and sent automatically.",
      risk: "Low Risk — Routine Export Document",
      confidence: "High",
      decisionNeeded: "Automated under 'Approved Phytosanitary Documents' policy.",
      suggestedReply: "",
      sources: ["ISPM-15 Certificate #ISPM15-BLW-2026.pdf", "Hamburg Packing List"],
      audit: ["07:15 AM • Document request received & dispatched automatically by Adityam"]
    },
    messages: [
      { id: "m1201", sender: "Hamburg Logistics Coordinator", text: "Please send the ISPM-15 wooden pallet heat-treatment certificate for container BLW-EU-9041.", time: "07:15 AM", isHuman: true, isSignal: true },
      { id: "m1202", sender: "Adityam", text: "Sent automatically by Adityam under 'Phytosanitary Certificates' policy: Attached Heat-Treatment Certificate ISPM15-BLW-2026.pdf.", time: "07:17 AM", isBot: true, isSignal: true, attachment: "ISPM15-BLW-2026.pdf" },
      { id: "m1203", sender: "Hamburg Logistics Coordinator", text: "Verified and received. Thanks Adityam!", time: "07:20 AM", isHuman: true, isSignal: true }
    ]
  }
];

const DELEGATE_SOURCES = {
  "Production Board • Batch EV-2409": {
    title: "Production Board • Batch EV-2409",
    type: "Operational Record",
    updated: "Today 10:42 AM",
    scope: "Internal Manufacturing Scope",
    fact: "Target SKU: Pulsar 220 Exhaust Valves (SUH3/21-4N). 420 pieces finished final grinding; 180 pieces scheduled for Nitrex Furnace 2 unloading Saturday 8:00 AM."
  },
  "QA Plan • Final inspection scheduled Saturday 8:00 AM": {
    title: "QA Inspection Plan • Rev 3",
    type: "Quality Protocol",
    updated: "Today 08:00 AM",
    scope: "Internal QA Scope",
    fact: "Lot EV-2409 final dimensional VMM inspection and nitriding depth verification scheduled Saturday 08:00 AM - 10:30 AM."
  },
  "Material Certificate MC-DEMO-77": {
    title: "Approved Material Certificate MC-DEMO-77",
    type: "Certified QA Document",
    updated: "Sept 18, 2026",
    scope: "Customer Document Scope (Public Standard)",
    fact: "SUH3 Intake / 21-4N Exhaust Bi-metallic Engine Valves. Liquid Carbo-Nitriding (LCN) depth 0.015-0.025mm. Micro Vickers Hardness: 910 HV."
  },
  "Dispatch Record DR-DEMO-551": {
    title: "Dispatch Record DR-DEMO-551",
    type: "Logistics Manifest",
    updated: "Today 07:45 AM",
    scope: "Logistics Scope",
    fact: "30 Wooden Cases (3,000 sets Boxer BM150 Valves). Truck MH-04-CG-9041. Port of Nhava Sheva destination."
  }
};

if (typeof window !== "undefined") {
  window.DELEGATE_BRIEFING = DELEGATE_BRIEFING;
  window.DELEGATE_GROUPS = DELEGATE_GROUPS;
  window.DELEGATE_SOURCES = DELEGATE_SOURCES;
}
