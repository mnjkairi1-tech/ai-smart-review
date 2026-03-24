import { useState } from 'react';
import { Star, Copy, Edit2, CheckCircle2 } from 'lucide-react';

const mockGenerateReviews = (stars, categories) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const templates = {
        5: [
          "Absolutely loved it! The {c} was amazing. Highly recommend to everyone.",
          "Perfect experience. Everything was top-notch, especially the {c}.",
          "Wow, just wow! Outstanding {c} and great overall vibe. 5 stars!",
          "Best place in town! I was really impressed by the {c}.",
          "Fantastic from start to finish. The {c} really stood out. Will return!",
          "A truly exceptional experience. Their {c} is unparalleled.",
          "Incredible service and amazing {c}. You have to try this place.",
          "Loved every second of it! Exceeded my expectations with their {c}.",
          "My new favorite spot! The {c} was just perfect.",
          "Brilliant! The {c} made my day. Highly recommend this amazing place."
        ],
        4: [
          "Really good experience. The {c} was quite nice.",
          "Overall great place! Enjoyed the {c} a lot.",
          "Worth trying for sure! The {c} was definitely the highlight.",
          "Solid 4 stars. Left feeling very happy with the {c}.",
          "Very nice! The {c} was better than expected.",
          "Good quality and nice {c}. Would come back again.",
          "A nice experience overall. Appreciated the good {c}.",
          "Pretty good! I liked the {c} specifically.",
          "Enjoyable visit. The {c} was up to the mark.",
          "Great job overall! The {c} made it a pleasant experience."
        ],
        3: [
          "Decent place overall. The {c} was just okay.",
          "An okay experience. Nothing special, but the {c} was fine.",
          "Not bad, but could improve. The {c} was acceptable.",
          "Average. Had a decent time, the {c} was standard.",
          "Fair experience. The {c} was what you'd expect.",
          "It was alright. The {c} was definitely the better part.",
          "Middle of the road. Fine {c}, but room for improvement.",
          "An okay visit. The {c} kept it from being a bad experience.",
          "Acceptable, but I've seen better. The {c} was fine.",
          "Reasonably okay. Liked the {c} but that's about it."
        ]
      };
      
      const selectedCats = categories.length > 0 ? categories.join(" and ") : "service";
      const starTemplates = templates[stars] || templates[5];
      
      const reviews = starTemplates.map((text, i) => 
        text.replace("{c}", selectedCats.toLowerCase())
      );
      
      // Shuffle slightly for variation, though they are already 10 unique templates
      resolve(reviews);
    }, 1500);
  });
};

const STEPS = {
  RATING: 'RATING',
  CATEGORIES: 'CATEGORIES',
  LOADING: 'LOADING',
  MANUAL: 'MANUAL',
  RESULTS: 'RESULTS'
};

const CATEGORY_OPTIONS = ["Staff", "Cleanliness", "Service", "Price", "Speed", "Environment"];

function App() {
  const [step, setStep] = useState(STEPS.RATING);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [manualReview, setManualReview] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleRatingSelect = (selectedStars) => {
    setRating(selectedStars);
    if (selectedStars <= 2) {
      setStep(STEPS.MANUAL);
    } else {
      setStep(STEPS.CATEGORIES);
    }
  };

  const toggleCategory = (cat) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const generateReviews = async () => {
    setStep(STEPS.LOADING);
    const generated = await mockGenerateReviews(rating, categories);
    setReviews(generated);
    setStep(STEPS.RESULTS);
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const startEditing = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = (id) => {
    const updated = [...reviews];
    updated[id] = editText;
    setReviews(updated);
    setEditingId(null);
  };

  return (
    <div className="app-container">
      <div className="glass-panel text-center">
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
                    fill={(hoverRating || rating) >= star ? "var(--star-color)" : "transparent"} 
                    color={(hoverRating || rating) >= star ? "var(--star-color)" : "var(--star-disabled)"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === STEPS.CATEGORIES && (
          <div className="fade-in">
            <h1>What did you like?</h1>
            <p className="mb-4">Select all that apply (Optional)</p>
            
            <div className="categories-grid">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${categories.includes(cat) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button className="btn w-full" onClick={generateReviews}>
                Generate Reviews ✨
              </button>
            </div>
          </div>
        )}

        {step === STEPS.LOADING && (
          <div className="fade-in">
            <div className="loader"></div>
            <h3>Crafting magic...</h3>
            <p>Creating natural review suggestions based on your feedback.</p>
          </div>
        )}

        {step === STEPS.MANUAL && (
          <div className="fade-in text-left">
            <h1 className="text-center">Tell us more</h1>
            <p className="text-center">Please write your honest feedback.</p>
            <textarea
              className="review-textarea"
              placeholder="What went wrong?"
              value={manualReview}
              onChange={(e) => setManualReview(e.target.value)}
            ></textarea>
            
            <button 
              className="btn" 
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => handleCopy(manualReview, 'manual')}
              disabled={!manualReview.trim()}
            >
              <Copy size={18} /> Copy Review
            </button>
          </div>
        )}

        {step === STEPS.RESULTS && (
          <div className="fade-in text-left">
            <h1 className="text-center">Pick a Review</h1>
            <p className="text-center" style={{ marginBottom: '1.5rem' }}>Select the one you like, edit if needed, and paste on Google!</p>
            
            {reviews.map((rev, idx) => (
              <div key={idx} className="glass-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                {editingId === idx ? (
                  <div>
                    <textarea 
                      className="review-textarea" 
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="review-card-actions">
                      <button className="btn btn-icon" onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="btn" onClick={() => saveEdit(idx)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', margin: 0 }}>"{rev}"</p>
                    <div className="review-card-actions">
                      <button className="btn btn-icon" onClick={() => startEditing(idx, rev)}>
                        <Edit2 size={16} /> Edit
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => handleCopy(rev, idx)}
                        style={{ backgroundColor: copiedId === idx ? '#48bb78' : '' }}
                      >
                        {copiedId === idx ? (
             <><CheckCircle2 size={18} /> Copied</>
                        ) : (
                          <><Copy size={18} /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;
