(function () {
  'use strict';

  const PHONE = '919231580965';
  const EMAIL = 'chowdhuryguesthouse@gmail.com';

  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initDates();
    initAvailabilityForms();
    initBookingForm();
    focusRequestedRoom();
  });

  function initMenu() {
    const button = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');
    if (!button || !nav) return;
    button.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      document.body.classList.toggle('menu-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
    }));
  }

  function isoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function initDates() {
    const today = new Date();
    document.querySelectorAll('input[type="date"]').forEach(input => {
      input.min = isoDate(today);
    });

    document.querySelectorAll('[data-date-pair]').forEach(wrapper => {
      const checkIn = wrapper.querySelector('[name="checkin"]');
      const checkOut = wrapper.querySelector('[name="checkout"]');
      if (!checkIn || !checkOut) return;
      checkIn.addEventListener('change', () => {
        if (!checkIn.value) return;
        const nextDay = new Date(`${checkIn.value}T12:00:00`);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOut.min = isoDate(nextDay);
        if (!checkOut.value || checkOut.value <= checkIn.value) checkOut.value = isoDate(nextDay);
      });
    });
  }

  function initAvailabilityForms() {
    document.querySelectorAll('[data-availability-form]').forEach(form => {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const params = new URLSearchParams();
        ['checkin', 'checkout', 'room'].forEach(key => {
          if (data.get(key)) params.set(key, data.get(key));
        });
        window.location.href = `booking.html?${params.toString()}`;
      });
    });
  }

  function initBookingForm() {
    const form = document.querySelector('[data-booking-request]');
    if (!form) return;
    const query = new URLSearchParams(window.location.search);
    ['checkin', 'checkout', 'room'].forEach(key => {
      const element = form.elements.namedItem(key);
      if (element && query.get(key)) element.value = query.get(key);
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const message = [
        'Hello Chowdhurys’ Estate Guest House,',
        '',
        'I would like to request room availability:',
        `Guest: ${d.get('name')}`,
        `Check-in: ${d.get('checkin')}`,
        `Check-out: ${d.get('checkout')}`,
        `Room: ${d.get('room')}`,
        `Guests: ${d.get('adults')} adult(s), ${d.get('children')} child/children`,
        `Phone: ${d.get('phone')}`,
        `Email: ${d.get('email')}`,
        d.get('notes') ? `Notes: ${d.get('notes')}` : '',
        '',
        'Please confirm availability and the final tariff.'
      ].filter(Boolean).join('\n');
      window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });

    const emailButton = document.querySelector('[data-email-request]');
    if (emailButton) emailButton.addEventListener('click', () => {
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const body = `Guest: ${d.get('name')}\nCheck-in: ${d.get('checkin')}\nCheck-out: ${d.get('checkout')}\nRoom: ${d.get('room')}\nAdults: ${d.get('adults')}\nChildren: ${d.get('children')}\nPhone: ${d.get('phone')}\nNotes: ${d.get('notes') || 'None'}\n\nPlease confirm availability and the final tariff.`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Room availability request')}&body=${encodeURIComponent(body)}`;
    });
  }

  function focusRequestedRoom() {
    if (!location.pathname.endsWith('rooms.html')) return;
    const room = new URLSearchParams(location.search).get('id');
    if (room && document.getElementById(room)) document.getElementById(room).scrollIntoView({ behavior: 'smooth' });
  }
})();
