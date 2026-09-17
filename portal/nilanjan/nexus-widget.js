(function () {
  'use strict';

  const facts = {
    rooms: 'There are four published room categories: Deluxe A.C. Room from ₹2,700, Executive Deluxe A.C. from ₹3,500, Presidential Room from ₹3,700, and Quality Suite from ₹4,000 per day. Published tariffs should be confirmed with the front desk.',
    location: 'The guest house is at 55 Chowringhee Road, Kolkata 700071, near Exide Crossing and Rabindra Sadan Metro. Victoria Memorial, Maidan, St. Paul’s Cathedral, Park Street, shopping, clubs and business areas are nearby.',
    amenities: 'Published amenities include air conditioning, Wi-Fi, cable TV, EPABX/intercom, complimentary breakfast, room service, bottled water, tea and coffee facilities, and free parking. The property does not advertise a swimming pool.',
    events: 'The property lists conference facilities for 12–60 people, an air-conditioned banquet hall for up to 125, and a smaller banquet hall for up to 45. Separate vegetarian and non-vegetarian kitchens are also listed.',
    transport: 'Airport and railway-station transport can be arranged at extra cost. Please contact the front desk in advance to confirm timing and price.',
    contact: 'Call +91 92315 80965 or +91 80170 69777. Landlines: +91 33 2282 1817 and +91 33 2282 8554/5. Email: chowdhuryguesthouse@gmail.com.',
    booking: 'Use the Book Now page to send an availability request by WhatsApp or email. The front desk will confirm the room, final tariff, taxes and payment instructions.',
    breakfast: 'Complimentary breakfast is listed for staying guests. Please confirm current service times and menu with the front desk.',
    parking: 'Free parking is listed among the property facilities. Availability should be confirmed for your stay dates.',
    checkout: 'The property advertises 24-hour check-out facilities. Please confirm the exact arrival and departure arrangement before booking.',
    pool: 'There is no swimming pool advertised for this property.',
    presidential: 'The Presidential Room accommodates 2 adults, has two separate beds, a drawing area, a sofa, and views toward Chowringhee. Published tariff: ₹3,700 per day.',
    quality: 'The Quality Suite accommodates 2 adults with a bedroom and drawing room, two separate beds, writing table and sofa. Published tariff: ₹4,000 per day.',
    executive: 'The Executive Deluxe A.C. room accommodates 2 adults, with two separate beds, a tea table, sofa and views toward Victoria Memorial. Published tariff: ₹3,500 per day.',
    deluxe: 'The Deluxe A.C. Room accommodates 2 adults and lists a king bed, tea table and sofa. Published tariff: ₹2,700 per day.'
  };

  document.addEventListener('DOMContentLoaded', createWidget);

  function createWidget() {
    const wrapper = document.createElement('div');
    wrapper.id = 'nexus-chat-widget';
    wrapper.innerHTML = `
      <button class="nexus-trigger-btn" id="nexus-toggle" aria-expanded="false" aria-controls="nexus-window">
        <span class="nexus-dot" aria-hidden="true"></span><span>NEXUS Concierge</span>
      </button>
      <section class="nexus-chat-window" id="nexus-window" aria-label="NEXUS guest house concierge">
        <header class="nexus-chat-header">
          <div><h4>NEXUS Concierge</h4><small>Property information · Available now</small></div>
          <button class="nexus-close" id="nexus-close" aria-label="Close concierge">×</button>
        </header>
        <div class="nexus-chat-messages" id="nexus-messages" aria-live="polite">
          <div class="nexus-msg bot">Welcome to Chowdhurys’ Estate Guest House. Ask me about rooms, rates, location, amenities, events or booking.</div>
        </div>
        <div class="nexus-quick" aria-label="Suggested questions">
          <button data-question="What are the room rates?">Room rates</button>
          <button data-question="Where are you located?">Location</button>
          <button data-question="What amenities are available?">Amenities</button>
          <button data-question="How can I book?">How to book</button>
        </div>
        <form class="nexus-chat-input" id="nexus-form">
          <input id="nexus-input" aria-label="Message" autocomplete="off" placeholder="Ask a question…" required>
          <button type="submit">Send</button>
        </form>
      </section>`;
    document.body.appendChild(wrapper);

    const toggle = wrapper.querySelector('#nexus-toggle');
    const close = wrapper.querySelector('#nexus-close');
    const windowEl = wrapper.querySelector('#nexus-window');
    const form = wrapper.querySelector('#nexus-form');
    const input = wrapper.querySelector('#nexus-input');
    const messages = wrapper.querySelector('#nexus-messages');

    function setOpen(open) {
      windowEl.style.display = open ? 'flex' : 'none';
      toggle.setAttribute('aria-expanded', String(open));
      if (open) input.focus();
    }
    toggle.addEventListener('click', () => setOpen(windowEl.style.display !== 'flex'));
    close.addEventListener('click', () => setOpen(false));
    wrapper.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => submitQuestion(button.dataset.question)));
    form.addEventListener('submit', event => {
      event.preventDefault();
      submitQuestion(input.value);
    });

    async function submitQuestion(raw) {
      const question = String(raw || '').trim();
      if (!question) return;
      addMessage(question, 'user');
      input.value = '';

      const apiBase = String(window.NEXUS_API_BASE || '').replace(/\/$/, '');
      if (apiBase) {
        try {
          const response = await fetch(`${apiBase}/api/nexus/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: question })
          });
          if (!response.ok) throw new Error('NEXUS API unavailable');
          const data = await response.json();
          if (data.reply) return addMessage(data.reply, 'bot');
        } catch (_) {
          // The verified local knowledge base keeps the concierge available.
        }
      }
      window.setTimeout(() => addMessage(localAnswer(question), 'bot'), 180);
    }

    function addMessage(text, type) {
      const div = document.createElement('div');
      div.className = `nexus-msg ${type}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
  }

  function localAnswer(question) {
    const q = question.toLowerCase();
    if (/pool|swim/.test(q)) return facts.pool;
    if (/presidential/.test(q)) return facts.presidential;
    if (/quality/.test(q)) return facts.quality;
    if (/executive/.test(q)) return facts.executive;
    if (/deluxe/.test(q)) return facts.deluxe;
    if (/rate|price|cost|tariff|room/.test(q)) return facts.rooms;
    if (/where|location|address|metro|near|direction/.test(q)) return facts.location;
    if (/banquet|conference|wedding|event|meeting|hall|kitchen/.test(q)) return facts.events;
    if (/airport|station|pickup|pick-up|transport|drop/.test(q)) return facts.transport;
    if (/breakfast|food|restaurant|dining/.test(q)) return facts.breakfast;
    if (/parking|car/.test(q)) return facts.parking;
    if (/checkout|check-out|check in|check-in/.test(q)) return facts.checkout;
    if (/book|reserve|availability/.test(q)) return facts.booking;
    if (/phone|call|email|contact|whatsapp/.test(q)) return facts.contact;
    if (/amenit|facility|wifi|wi-fi|television|tv|service/.test(q)) return facts.amenities;
    return `I can help with rooms, rates, location, amenities, events, transport and booking. ${facts.contact}`;
  }
})();
