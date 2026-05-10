// ═══════════════════════════════════════════
// REVIEWS.JS — Customer Reviews
// ═══════════════════════════════════════════
'use strict';

async function loadAndRenderReviews() {
  try {
    const reviews = await DB.getApprovedReviews();
    await renderReviews(reviews);
  } catch(e) {
    console.error('Reviews load failed:', e);
  }
}

async function renderReviews(reviews) {

  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  if (!reviews || !reviews.length) {

    grid.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted);grid-column:1/-1">
        <div style="font-size:44px;margin-bottom:12px">💬</div>
        <p>No reviews yet — be the first to share your experience!</p>
      </div>
    `;

    return;
  }

  const avg = (
    reviews.reduce((s,r)=>s+(r.rating||5),0) / reviews.length
  ).toFixed(1);

  const ratingEl = document.getElementById('avgRating');

  if (ratingEl) {
    ratingEl.textContent =
      `⭐ ${avg} / 5 (${reviews.length} review${reviews.length>1?'s':''})`;
  }

  const cards = await Promise.all(

    reviews.map(async (r,i) => {

      let avatar = '';

      if (r.customer_email) {

        try {

          const user = await DB.findUser(r.customer_email);

          avatar = user?.avatar || '';

        } catch(e) {
          console.error(e);
        }

      }

      return `
        <div class="review-card" style="animation-delay:${i*0.06}s">

          <div class="review-header">

            <div class="reviewer-avatar">

              ${avatar
                ? `
                  <img
                    src="${avatar}"
                    alt="${r.customer_name}"
                    onerror="this.style.display='none'"
                  >
                `
                : `
                  <div class="avatar-placeholder">
                    ${r.customer_name[0].toUpperCase()}
                  </div>
                `
              }

            </div>

            <div class="reviewer-info">
              <div class="reviewer-name">
                ${r.customer_name}
              </div>

              <div class="reviewer-date">
                ${fmtDate(r.created_at)}
              </div>
            </div>

            <div class="review-stars">
              ${'⭐'.repeat(r.rating||5)}
            </div>

          </div>

          ${r.product_name
            ? `
              <div class="review-product">
                📦 ${r.product_name}
              </div>
            `
            : ''
          }

          ${r.comment
            ? `
              <div class="review-comment">
                "${r.comment}"
              </div>
            `
            : ''
          }

          ${r.photo
            ? `
              <img
                class="review-photo"
                src="${r.photo}"
                alt="Review photo"
                loading="lazy"
                onerror="this.style.display='none'"
              >
            `
            : ''
          }

        </div>
      `;

    })

  );

  grid.innerHTML = cards.join('');
}

function fmtDate(str) {

  if (!str) return '';

  try {

    return new Date(str).toLocaleDateString(
      'en-IN',
      {
        day:'numeric',
        month:'short',
        year:'numeric'
      }
    );

  } catch {

    return '';

  }

}

function openReviewModal() {

  const s = getSession();

  const box = document.getElementById('reviewModalBox');

  box.innerHTML = `

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2>Leave a Review ⭐</h2>
      <button class="btn-close" onclick="closeReviewModal()">×</button>
    </div>

    <div class="form-group">
      <label>Your Name *</label>
      <input
        type="text"
        id="rvName"
        value="${s?s.name:''}"
        placeholder="Your name"
      >
    </div>

    <div class="form-group">
      <label>Which product did you buy?</label>
      <input
        type="text"
        id="rvProduct"
        placeholder="e.g. Ocean Frame, Book Mark..."
      >
    </div>

    <div class="form-group">

      <label>Your Rating *</label>

      <div class="star-picker" id="starPicker">

        ${[1,2,3,4,5].map(n=>`
          <button
            class="star-btn selected"
            onclick="pickStar(${n})"
            data-star="${n}"
          >
            ★
          </button>
        `).join('')}

      </div>

      <input type="hidden" id="rvRating" value="5">

    </div>

    <div class="form-group">

      <label>Your Review *</label>

      <textarea
        id="rvComment"
        placeholder="Tell others about your experience — the quality, packaging, how it looked in real life..."
      ></textarea>

    </div>

    <div class="form-group">

      <label>
        Add a Photo
        <span style="font-size:11px;color:var(--muted)">
          (optional — show off your purchase!)
        </span>
      </label>

      <div class="upload-area-rv">

        <input
          type="file"
          id="rvPhoto"
          accept="image/*"
          onchange="previewRvPhoto(this)"
        >

        <div style="font-size:28px;margin-bottom:6px">📸</div>

        <p style="font-size:13px;color:var(--muted)">
          Tap to upload your photo
        </p>

      </div>

      <img
        id="rvPhotoPreview"
        style="width:100%;border-radius:10px;margin-top:8px;display:none;max-height:180px;object-fit:cover"
        alt="preview"
      >

    </div>

    <p style="font-size:12px;color:var(--muted);margin-bottom:14px">
      💛 Kindly review your details once before submitting your feedback.
    </p>

    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeReviewModal()">
        Cancel
      </button>

      <button
        class="btn-place-order"
        id="submitRvBtn"
        onclick="submitReview()"
      >
        Submit Review ✓
      </button>
    </div>
  `;

  document.getElementById('reviewModal').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}

function pickStar(n) {

  document.getElementById('rvRating').value = n;

  document.querySelectorAll('.star-btn')
    .forEach((b,i) => b.classList.toggle('selected', i<n));
}

function previewRvPhoto(input) {

  const f = input.files[0];

  if(!f) return;

  const r = new FileReader();

  r.onload = e => {

    const img = document.getElementById('rvPhotoPreview');

    img.src = e.target.result;

    img.style.display = 'block';
  };

  r.readAsDataURL(f);
}

async function submitReview() {

  const s       = getSession();

  const name    = document.getElementById('rvName')?.value.trim();

  const product = document.getElementById('rvProduct')?.value.trim();

  const rating  = parseInt(
    document.getElementById('rvRating')?.value
  ) || 5;

  const comment = document.getElementById('rvComment')?.value.trim();

  const photoEl = document.getElementById('rvPhotoPreview');

  const photo =
    (photoEl?.style.display !== 'none' && photoEl?.src)
      ? photoEl.src
      : '';

  if (!name) {
    alert('Please enter your name.');
    return;
  }

  if (!comment) {
    alert('Please write your review.');
    return;
  }

  const btn = document.getElementById('submitRvBtn');

  if (btn) {
    btn.textContent = 'Submitting...';
    btn.disabled = true;
  }

  try {

    await DB.addReview({

      customer_name:  name,

      product_name:   product || '',

      rating,

      comment,

      photo:          photo || '',

      approved:       false,

      customer_email: s ? s.email : ''

    });

    document.getElementById('reviewModalBox').innerHTML = `

      <div style="text-align:center;padding:30px 20px">

        <div style="font-size:56px;margin-bottom:16px">🙏</div>

        <h3 style="font-family:'Playfair Display',serif;color:var(--brown);margin-bottom:8px">
          Thank you, ${name}!
        </h3>

        <p style="color:var(--muted);font-size:14px;line-height:1.7">

          Your review has been submitted Successfully.<br>
          We truly appreciate your feedback! 💛

        </p>

        <br>

        <button
          class="btn-place-order"
          onclick="closeReviewModal()"
          style="width:auto;padding:10px 24px"
        >
          Close
        </button>

      </div>
    `;

  } catch(e) {

    console.error(e);

    alert('Could not submit review. Please try again.');

    if (btn) {
      btn.textContent='Submit Review ✓';
      btn.disabled=false;
    }

  }

}

function closeReviewModal() {

  document.getElementById('reviewModal').classList.remove('show');

  document.getElementById('overlay').classList.remove('show');

}