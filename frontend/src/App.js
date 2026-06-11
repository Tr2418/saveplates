import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = 'http://localhost:5001/api/donations';

const DONOR_TYPES = ['Select venue type...', 'Wedding Hall', 'Hostel', 'Hotel', 'Bakery'];

const NGOS = [
  { name: 'Hope Orphanage', desc: 'Home for 60 children, daily meal requirement', emoji: '🏡' },
  { name: 'ElderCare Foundation', desc: 'Shelter for 45 senior citizens', emoji: '👴' },
  { name: 'Sparsh Foundation', desc: 'Night shelter & food bank for homeless', emoji: '🤝' },
  { name: 'Annapurna Kitchen', desc: 'Community kitchen serving 200+ daily', emoji: '🍛' },
];

function createParticles(container) {
  if (!container) return;
  const colors = ['#34d399', '#fbbf24', '#fb7185', '#60a5fa', '#a78bfa'];
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 14) * 360;
    const dist = 60 + Math.random() * 80;
    p.style.setProperty('--tx', `${Math.cos((angle * Math.PI) / 180) * dist}px`);
    p.style.setProperty('--ty', `${Math.sin((angle * Math.PI) / 180) * dist}px`);
    p.style.background = colors[i % colors.length];
    p.style.left = '50%';
    p.style.top = '50%';
    container.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

export default function App() {
  const [donations, setDonations] = useState([]);
  const [totalMeals, setTotalMeals] = useState(0);
  const [animateMeals, setAnimateMeals] = useState(false);
  const [animateClaims, setAnimateClaims] = useState(false);
  const [animateDonors, setAnimateDonors] = useState(false);
  const [claimCount, setClaimCount] = useState(0);
  const [donorCount, setDonorCount] = useState(0);
  const [formData, setFormData] = useState({
    donorType: '',
    foodItems: '',
    quantity: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const mealsImpactRef = useRef(null);
  const claimsImpactRef = useRef(null);
  const donorsImpactRef = useRef(null);

  const fetchDonations = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      if (json.success) {
        setDonations(json.data);
        setTotalMeals(json.totalCompletedMeals || 0);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
    const interval = setInterval(fetchDonations, 8000);
    return () => clearInterval(interval);
  }, [fetchDonations]);

  const triggerParticle = (ref, setter) => {
    if (ref.current) createParticles(ref.current);
    setter(true);
    setTimeout(() => setter(false), 500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.donorType || !formData.foodItems || !formData.quantity || !formData.location) return;
    setSubmitting(true);
    try {
      const payload = {
        donorType: formData.donorType,
        foodItems: formData.foodItems,
        quantity: Number(formData.quantity),
        location: formData.location,
      };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setDonations((prev) => [json.data, ...prev]);
        setFormData({ donorType: '', foodItems: '', quantity: '', location: '' });
        setDonorCount((prev) => prev + 1);
        setTotalMeals((prev) => prev + json.data.quantity);
        triggerParticle(donorsImpactRef, setAnimateDonors);
        triggerParticle(mealsImpactRef, setAnimateMeals);
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Claimed' : 'Completed';
    setClaimingId(id);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setDonations((prev) =>
          prev.map((d) => (d._id === id ? { ...d, status: json.data.status } : d))
        );
        if (newStatus === 'Claimed') {
          setClaimCount((prev) => prev + 1);
          triggerParticle(claimsImpactRef, setAnimateClaims);
        }
        if (newStatus === 'Completed') {
          const meal = donations.find((d) => d._id === id);
          if (meal) {
            setTotalMeals((prev) => prev + meal.quantity);
            triggerParticle(mealsImpactRef, setAnimateMeals);
          }
        }
      }
    } catch (err) {
      console.error('Claim error:', err);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <>
      <div className="background-blobs">
        <div className="blob" />
        <div className="blob" />
        <div className="blob" />
      </div>

      <div className="container">
        <section className="hero">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Live &middot; ResQFood Network
          </div>
          <h1 className="hero-title">
            Rescue <span className="highlight-emerald">Surplus</span>,<br />
            Feed <span className="highlight-amber">Hope</span>
          </h1>
          <p className="hero-subtitle">
            A smart logistics platform connecting food donors with NGOs and volunteers —
            reducing waste, one meal at a time.
          </p>
        </section>

        <div className="bento-grid">
          <div className="bento-panel">
            <div className="panel-header">
              <div className="panel-icon">🍱</div>
              <div>
                <div className="panel-title">Live Donation Engine</div>
                <div className="panel-subtitle">Post surplus food available for pickup</div>
              </div>
            </div>
            <form className="donation-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Venue Type</label>
                  <select
                    className="form-select"
                    name="donorType"
                    value={formData.donorType}
                    onChange={handleInputChange}
                    required
                  >
                    {DONOR_TYPES.map((t) => (
                      <option key={t} value={t === 'Select venue type...' ? '' : t} disabled={t === 'Select venue type...'}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity (servings)</label>
                  <input
                    className="form-input"
                    type="number"
                    name="quantity"
                    placeholder="e.g. 50"
                    min="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Food Items</label>
                <input
                  className="form-input"
                  type="text"
                  name="foodItems"
                  placeholder="e.g. Veg biryani, dal, roti, salad"
                  value={formData.foodItems}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pickup Location</label>
                <input
                  className="form-input"
                  type="text"
                  name="location"
                  placeholder="e.g. Grand Palace, Andheri West, Mumbai"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : '🚀 Donate Surplus Food'}
              </button>
            </form>
          </div>

          <div className="bento-panel">
            <div className="panel-header">
              <div className="panel-icon">📡</div>
              <div>
                <div className="panel-title">Real-time Broadcast Hub</div>
                <div className="panel-subtitle">Live listings from nearby donors</div>
              </div>
            </div>
            <div className="alert-badge">
              🚨 Match Alert: {donations.filter((d) => d.status === 'Pending').length} NGOs Nearby Notified
            </div>
            <div className="donation-feed">
              {donations.length === 0 ? (
                <div className="feed-empty">No active listings yet. Be the first to donate!</div>
              ) : (
                donations.map((d, idx) => (
                  <div
                    className="donation-card"
                    key={d._id}
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className="card-top">
                      <span className="card-donor-type">{d.donorType}</span>
                      <span className={`card-status ${d.status === 'Pending' ? 'pending' : 'claimed'}`}>
                        {d.status === 'Pending' ? '● Available' : '● Claimed'}
                      </span>
                    </div>
                    <div className="card-food">{d.foodItems}</div>
                    <div className="card-meta">
                      <span>🍽️ {d.quantity} servings</span>
                      <span>📍 {d.location}</span>
                    </div>
                    {d.status === 'Pending' && (
                      <button
                        className="btn btn-claim"
                        onClick={() => handleClaim(d._id, d.status)}
                        disabled={claimingId === d._id}
                      >
                        {claimingId === d._id ? 'Processing...' : '✅ Accept Pickup Mission'}
                      </button>
                    )}
                    {d.status === 'Claimed' && (
                      <button
                        className="btn btn-claim"
                        onClick={() => handleClaim(d._id, d.status)}
                        disabled={claimingId === d._id}
                        style={{ background: 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)' }}
                      >
                        {claimingId === d._id ? 'Processing...' : '✅ Mark as Delivered'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bento-panel panel-wide">
          <div className="panel-header">
            <div className="panel-icon">🌍</div>
            <div>
              <div className="panel-title">NGO & Volunteer Nexus</div>
              <div className="panel-subtitle">Verified local partners ready to receive food</div>
            </div>
          </div>
          <div className="ngo-grid">
            {NGOS.map((ngo, idx) => (
              <div
                className="ngo-card"
                key={ngo.name}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="ngo-avatar">{ngo.emoji}</div>
                <div className="ngo-name">{ngo.name}</div>
                <div className="ngo-desc">{ngo.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="impact-section">
          <div className="bento-panel panel-wide" style={{ padding: '32px' }}>
            <div className="panel-header" style={{ marginBottom: '28px' }}>
              <div className="panel-icon">⚡</div>
              <div>
                <div className="panel-title">Impact Accelerator</div>
                <div className="panel-subtitle">Real-time gamified impact tracker</div>
              </div>
            </div>
            <div className="impact-grid">
              <div className="impact-card">
                <div className="particle-burst" ref={mealsImpactRef} />
                <div className="impact-card-icon">🍽️</div>
                <div className={`impact-card-value ${animateMeals ? 'bounce-number' : ''}`}>
                  {totalMeals.toLocaleString()}
                </div>
                <div className="impact-card-label">Total Meals Saved</div>
                <div className="impact-card-sub">Lives impacted across the network</div>
              </div>
              <div className="impact-card">
                <div className="particle-burst" ref={claimsImpactRef} />
                <div className="impact-card-icon">🚚</div>
                <div className={`impact-card-value ${animateClaims ? 'bounce-number' : ''}`}>
                  {claimCount.toLocaleString()}
                </div>
                <div className="impact-card-label">Pickups Completed</div>
                <div className="impact-card-sub">Volunteer missions fulfilled</div>
              </div>
              <div className="impact-card">
                <div className="particle-burst" ref={donorsImpactRef} />
                <div className="impact-card-icon">🤲</div>
                <div className={`impact-card-value ${animateDonors ? 'bounce-number' : ''}`}>
                  {donorCount.toLocaleString()}
                </div>
                <div className="impact-card-label">Active Donors</div>
                <div className="impact-card-sub">Businesses contributing surplus</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          ResQFood &copy; {new Date().getFullYear()} &middot; Built with purpose &middot;{" "}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </footer>
      </div>
    </>
  );
}
