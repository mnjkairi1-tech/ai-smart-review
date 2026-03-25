import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Copy, Edit2, CheckCircle2, ExternalLink } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const CATEGORY_OPTIONS = ['Staff', 'Cleanliness', 'Service', 'Price', 'Speed', 'Environment'];
const STEPS = { LOADING_SHOP: 'LOADING_SHOP', INVALID: 'INVALID', RATING: 'RATING', CATEGORIES: 'CATEGORIES', GENERATING: 'GENERATING', MANUAL: 'MANUAL', RESULTS: 'RESULTS' };

const generateReviews = (stars, categories) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const catStr = categories.length > 0 ? categories.join(' and ') : 'overall service';
      const templates = {
        5: [
          `Absolutely fantastic! The ${catStr} exceeded all expectations. A must-visit!`,
          `5 stars without hesitation! The ${catStr} was top-notch from start to finish.`,
          `Wow, just wow! Outstanding ${catStr} and amazing atmosphere. Highly recommend!`,
          `Best experience in town! I was blown away by the ${catStr}.`,
          `Incredible from start to finish. Their ${catStr} is truly unparalleled.`,
          `A gem of a place! The ${catStr} makes every visit so worthwhile.`,
          `Loved every moment here. The ${catStr} was simply perfect — 5 well-earned stars!`,
          `My absolute favorite spot now! The ${catStr} sets the gold standard.`,
          `Exceptional in every way. The ${catStr} left me thoroughly impressed.`,
          `Brilliant visit! The ${catStr} made my day. Will be back again and again!`,
        ],
        4: [
          `Really solid experience. The ${catStr} was quite impressive overall.`,
          `Great place! Thoroughly enjoyed the ${catStr} — definitely coming back.`,
          `Worth every visit! The ${catStr} was the clear highlight of the experience.`,
          `Very happy with my visit. The ${catStr} was better than expected!`,
          `4 solid stars. Left feeling very satisfied with the ${catStr}.`,
          `Good quality all around. The ${catStr} was praised by everyone in our group.`,
          `Pleasant experience from start to end. Appreciated the focus on ${catStr}.`,
          `Pretty great! The ${catStr} stood out and made it a memorable visit.`,
          `Enjoyable visit. The ${catStr} was definitely up to the mark.`,
          `Great job! The ${catStr} made it a thoroughly pleasant experience.`,
        ],
        3: [
          `Decent overall. The ${catStr} was okay, could use some improvement.`,
          `An average experience. The ${catStr} was fine, nothing extraordinary.`,
          `Not bad, but there's room to grow. The ${catStr} was acceptable.`,
          `Had an okay time. The ${catStr} was standard — meeting basic expectations.`,
          `Fair experience. The ${catStr} was what you'd expect for the price.`,
          `It was alright. The ${catStr} was the better part of the visit.`,
          `Middle of the road. Fine ${catStr}, but definitely room for improvement.`,
          `An okay visit. The ${catStr} kept it from being a disappointing experience.`,
          `Acceptable, but I've had better. The ${catStr} was decent enough.`,
          `Reasonably okay. Liked the ${catStr} but not completely blown away.`,
        ],
      };
      resolve(templates[stars] || templates[5]);
    }, 1500);
  });
};

export default function CustomerApp() {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shop');

  const [appStep, setAppStep] = useState(STEPS.LOADING_SHOP);
  const [shopData, setShopData] = useState(null);

  const [step, setStep] = useState(STEPS.RATING);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [manualReview, setManualReview] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [openedReview, setOpenedReview] = useState(null);

  // Load shop and track click
  useEffect(() => {
    const loadShop = async () => {
      if (!shopId) { setAppStep(STEPS.INVALID); return; }
      try {
        const shopRef = doc(db, 'shops', shopId);
        const shopSnap = await getDoc(shopRef);
        if (!shopSnap.exists()) { setAppStep(STEPS.INVALID); return; }
        setShopData({ id: shopId, ...shopSnap.data() });
        // Track the click
        await updateDoc(shopRef, { clicks: increment(1) });
        setAppStep('READY');
      } catch (e) {
        console.error(e);
        setAppStep(STEPS.INVALID);
      }
    };
    loadShop();
  }, [shopId]);

  const handleRatingSelect = (selectedStars) => {
    setRating(selectedStars);
    setStep(selectedStars <= 2 ? STEPS.MANUAL : STEPS.CATEGORIES);
  };

  const toggleCategory = (cat) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleGenerateReviews = async () => {
    setStep(STEPS.GENERATING);
    const generated = await generateReviews(rating, categories);
    setReviews(generated);
    setStep(STEPS.RESULTS);
  };

  const handleCopyAndOpen = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setOpenedReview(id);
      setTimeout(() => setCopiedId(null), 3000);
      // Open Google Review link
      if (shopData?.googleReviewLink) {
        window.open(shopData.googleReviewLink, '_blank');
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const saveEdit = (id) => {
    const updated = [...reviews];
    updated[id] = editText;
    setReviews(updated);
    setEditingId(null);
  };

  // Loading shop state
  if (appStep === STEPS.LOADING_SHOP) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader"></div>
      </div>
    );
  }

  // Invalid / no shop
  if (appStep === STEPS.INVALID) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel text-center fade-in" style={{ maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem' }}>Invalid QR Code</h1>
          <p>This QR code is not linked to any business. Please scan a valid QR code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="glass-panel text-center">

        {/* Shop Name Header */}
        {shopData?.shopName && (
          <div className="shop-header fade-in">
            <div className="shop-logo">⭐</div>
            <p className="shop-name-label">{shopData.shopName}</p>
          </div>
        )}

        {/* RATING STEP */}
        {step === STEPS.RATING && (
          <div className="fade-in">
            <h1>Rate Your Experience</h1>
            <p>Tap to rate out of 5 stars</p>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="star-btn"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRatingSelect(star)}
                >
                  <Star
                    fill={(hoverRating || rating) >= star ? 'var(--star-color)' : 'transparent'}
                    color={(hoverRating || rating) >= star ? 'var(--star-color)' : 'var(--star-disabled)'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              {hoverRating === 5 ? '🎉 Amazing!' : hoverRating === 4 ? '😊 Great!' : hoverRating === 3 ? '😐 Okay' : hoverRating <= 2 && hoverRating > 0 ? '😞 Not good' : 'How was your visit?'}
            </p>
          </div>
        )}

        {/* CATEGORIES STEP */}
        {step === STEPS.CATEGORIES && (
          <div className="fade-in">
            <div className="stars-mini">
              {[1,2,3,4,5].map(s => (
                <Star key={s} fill={rating >= s ? 'var(--star-color)' : 'transparent'} color={rating >= s ? 'var(--star-color)' : 'var(--star-disabled)'} size={20} />
              ))}
            </div>
            <h1>What did you like?</h1>
            <p className="mb-4">Select all that apply (Optional)</p>
            <div className="categories-grid">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${categories.includes(cat) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {categories.includes(cat) ? '✓ ' : ''}{cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => { setStep(STEPS.RATING); setRating(0); setCategories([]); }}>
                ← Back
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={handleGenerateReviews}>
                Generate Reviews ✨
              </button>
            </div>
          </div>
        )}

        {/* GENERATING STEP */}
        {step === STEPS.GENERATING && (
          <div className="fade-in" style={{ padding: '2rem 0' }}>
            <div className="loader"></div>
            <h3>Crafting your review...</h3>
            <p>Creating natural, personalized review suggestions.</p>
          </div>
        )}

        {/* MANUAL / LOW RATING STEP */}
        {step === STEPS.MANUAL && (
          <div className="fade-in text-left">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>😞</div>
              <h1>We're Sorry</h1>
              <p>Please share your honest feedback so we can improve.</p>
            </div>
            <textarea
              className="review-textarea"
              placeholder="What went wrong? We'd love to know..."
              value={manualReview}
              onChange={(e) => setManualReview(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => { setStep(STEPS.RATING); setRating(0); }}>
                ← Back
              </button>
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={() => handleCopyAndOpen(manualReview, 'manual')}
                disabled={!manualReview.trim()}
              >
                <Copy size={18} /> Copy & Submit
              </button>
            </div>
          </div>
        )}

        {/* RESULTS STEP */}
        {step === STEPS.RESULTS && (
          <div className="fade-in text-left">
            <div className="stars-mini" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} fill={rating >= s ? 'var(--star-color)' : 'transparent'} color={rating >= s ? 'var(--star-color)' : 'var(--star-disabled)'} size={20} />
              ))}
            </div>
            <h1 className="text-center">Pick Your Review</h1>
            <p className="text-center" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Tap <strong>Copy & Open</strong> — we'll copy the review and take you to Google! 🚀
            </p>

            {shopData?.googleReviewLink && (
              <div className="google-tip">
                <span>📋 Review will be copied, then Google Review page will open</span>
              </div>
            )}

            {reviews.map((rev, idx) => (
              <div key={idx} className="glass-card fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                {editingId === idx ? (
                  <div>
                    <textarea
                      className="review-textarea"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={{ minHeight: 80 }}
                    />
                    <div className="review-card-actions">
                      <button className="btn btn-icon" onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="btn" onClick={() => saveEdit(idx)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="review-text">"{rev}"</p>
                    {openedReview === idx && (
                      <div className="opened-badge">
                        <ExternalLink size={14} /> Google Review opened!
                      </div>
                    )}
                    <div className="review-card-actions">
                      <button className="btn btn-icon" onClick={() => { setEditingId(idx); setEditText(rev); }}>
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        className={`btn ${copiedId === idx ? 'btn-success' : ''}`}
                        onClick={() => handleCopyAndOpen(rev, idx)}
                      >
                        {copiedId === idx ? (
                          <><CheckCircle2 size={18} /> Copied & Opened</>
                        ) : (
                          <><Copy size={18} /> Copy & Open</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button className="btn btn-outline w-full" style={{ marginTop: '1rem' }} onClick={() => { setStep(STEPS.RATING); setRating(0); setCategories([]); setReviews([]); setOpenedReview(null); }}>
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
