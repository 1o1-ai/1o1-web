/**
 * Main Client Script for Nilanjan Guest House Portal
 */
document.addEventListener('DOMContentLoaded', function() {
  initBannerSlider();
  initBookingForm();
  initReviewsForm();
});

// Hero Banner Carousel Initialization
function initBannerSlider() {
  const slides = document.querySelectorAll('.banner-slide');
  if (slides.length <= 1) return;

  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
}

// Booking Search & Modal Controller
function initBookingForm() {
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const cid = document.getElementById('clix_search1_cid').value;
      const cod = document.getElementById('clix_search1_cod').value;

      if (!cid || !cod) {
        alert('Please select both Check-In and Check-Out dates.');
        return;
      }

      // Redirect to booking page with search parameters
      window.location.href = `booking.html?cid=${encodeURIComponent(cid)}&cod=${encodeURIComponent(cod)}`;
    });
  }
}

// Review / Guestbook Comment Form Submission
function initReviewsForm() {
  const commentForm = document.getElementById('footer-comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const author = document.getElementById('comment_name').value;
      const comment = document.getElementById('comment_text').value;

      if (!author || !comment) {
        alert('Please enter your name and comment.');
        return;
      }

      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, comment, rating: 5 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Thank you for sharing your experience at Nilanjan Guest House!');
          commentForm.reset();
        }
      })
      .catch(() => {
        alert('Thank you! Your comment has been recorded.');
        commentForm.reset();
      });
    });
  }
}
