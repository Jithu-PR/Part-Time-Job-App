import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../utils/authHelper';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      const auth = isAuthenticated();
      setIsLoggedIn(auth);
      if (auth) {
        const role = await getUserRole();
        setUserRole(role);
      }
    };
    checkAuth();
  }, []);

  const jobs = [
    { id: 1, icon: '🏪', bg: 'rgba(232,200,74,0.1)', title: 'Retail Floor Assistant', company: 'TrendCo', location: 'Downtown', hours: '6hr shift', pay: '$19', unit: '/hr', tags: ['Retail', 'Customer Facing'], category: 'retail', urgent: false },
    { id: 2, icon: '📦', bg: 'rgba(242,98,46,0.1)', title: 'Warehouse Packer', company: 'SwiftFulfilment', location: 'East Side', hours: '8hr shift', pay: '$21', unit: '/hr', tags: ['Warehouse', 'Physical'], category: 'warehouse', urgent: true },
    { id: 3, icon: '🛵', bg: 'rgba(74,222,128,0.1)', title: 'Last Mile Delivery Driver', company: 'ZipRun', location: 'City Wide', hours: 'Flexible', pay: '$23', unit: '/hr', tags: ['Delivery', 'Driving'], category: 'delivery', urgent: false },
    { id: 4, icon: '🛍️', bg: 'rgba(232,200,74,0.08)', title: 'Sales Associate', company: 'Luxe Brands', location: 'Mall', hours: '5hr shift', pay: '$17', unit: '/hr', tags: ['Sales', 'Retail'], category: 'retail', urgent: false },
    { id: 5, icon: '🚚', bg: 'rgba(74,222,128,0.08)', title: 'Van Delivery Driver', company: 'DayShip Co', location: 'North Zone', hours: '7hr shift', pay: '$22', unit: '/hr', tags: ['Delivery', 'Van'], category: 'delivery', urgent: true },
    { id: 6, icon: '🔧', bg: 'rgba(136,136,136,0.1)', title: 'Stock Room Operative', company: 'MegaStore', location: 'West End', hours: 'Full Day', pay: '$18', unit: '/hr', tags: ['Warehouse', 'Stocking'], category: 'warehouse', urgent: false },
    { id: 7, icon: '👔', bg: 'rgba(242,98,46,0.08)', title: 'Outbound Sales Rep', company: 'CallMax', location: 'City Centre', hours: '4hr shift', pay: '$16', unit: '/hr + bonus', tags: ['Sales', 'Phone'], category: 'retail', urgent: false },
    { id: 8, icon: '📬', bg: 'rgba(74,222,128,0.12)', title: 'Parcel Sorter', company: 'SwiftFulfilment', location: 'East Side', hours: 'Night Shift', pay: '$24', unit: '/hr', tags: ['Warehouse', 'Night'], category: 'warehouse', urgent: true },
  ];

  const filteredJobs = activeFilter === 'all' ? jobs : jobs.filter(j => j.category === activeFilter);

  const applyJob = (title: string, company: string) => {
    if (isLoggedIn) {
      if (userRole === 'Authenticated') {
        alert(`🎉 Application sent for "${title}" at ${company}!\n\nYou'll hear back within a few hours. Good luck, Mason!`);
      } else {
        alert(`Logged in as Restaurant Owner. Please log in as a Worker/Student to apply!`);
      }
    } else {
      alert(`Please log in or register as a Worker/Student to apply for this shift!\n\nWe'll take you to the Login page.`);
      navigate('/login');
    }
  };

  const getDashboardLink = () => {
    if (userRole === 'Restaurant Owner') return '/company';
    return '/student';
  };

  return (
    <div style={{ backgroundColor: 'var(--black)', color: 'var(--white)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav>
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Free<span>Mason</span>
        </div>
        <ul>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#jobs">Browse Jobs</a></li>
          <li><a href="#business">For Business</a></li>
          {isLoggedIn ? (
            <li><Link to={getDashboardLink()} className="nav-cta">Dashboard</Link></li>
          ) : (
            <li><Link to="/login" className="nav-cta">Get Started</Link></li>
          )}
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid-bg"></div>
        <div className="hero-left">
          <div className="hero-tag">Daily Gigs. Real Pay. No BS.</div>
          <h1>BUILD YOUR<br /><span className="accent">HUSTLE</span><br />SHIFT BY<br /><span className="accent2">SHIFT</span></h1>
          <p className="hero-sub">FreeMason connects workers with daily part-time shifts in retail, sales, warehousing & delivery. Sign up, get hired, get paid.</p>
          <div className="hero-actions">
            {isLoggedIn ? (
              <Link to={getDashboardLink()} className="btn-primary">Go To Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary font-bold">Find Shifts Today</Link>
                <Link to="/register" className="btn-outline">Post a Job</Link>
              </>
            )}
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-num">2,400+</div>
              <div className="stat-label">Jobs Posted</div>
            </div>
            <div>
              <div className="stat-num">840+</div>
              <div className="stat-label">Businesses</div>
            </div>
            <div>
              <div className="stat-num">$18</div>
              <div className="stat-label">Avg. Hourly</div>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="jobs-preview">
            <div className="jobs-preview-header">
              <span>Today's Shifts</span>
              <span className="live-dot">Live Now</span>
            </div>
            <div className="job-card" onClick={() => applyJob('Retail Floor Assistant', 'TrendCo')}>
              <div className="job-icon" style={{ background: 'rgba(232,200,74,0.1)' }}>🏪</div>
              <div className="job-info">
                <div className="job-title">Retail Floor Assistant</div>
                <div className="job-meta">TrendCo • Downtown • 6hr shift</div>
                <span className="job-badge badge-new">New</span>
              </div>
              <div>
                <div className="job-pay">$19/hr</div>
              </div>
            </div>
            <div className="job-card" onClick={() => applyJob('Warehouse Packer', 'SwiftFulfilment')}>
              <div className="job-icon" style={{ background: 'rgba(242,98,46,0.1)' }}>📦</div>
              <div className="job-info">
                <div className="job-title">Warehouse Packer</div>
                <div className="job-meta">SwiftFulfilment • East Side • 8hr</div>
                <span className="job-badge badge-hot">Hot</span>
              </div>
              <div>
                <div className="job-pay">$21/hr</div>
              </div>
            </div>
            <div className="job-card" onClick={() => applyJob('Last Mile Delivery Driver', 'ZipRun')}>
              <div className="job-icon" style={{ background: 'rgba(74,222,128,0.1)' }}>🛵</div>
              <div className="job-info">
                <div className="job-title">Last Mile Delivery Driver</div>
                <div className="job-meta">ZipRun • City Wide • Flexible</div>
                <span className="job-badge badge-fill">3 Left</span>
              </div>
              <div>
                <div className="job-pay">$23/hr</div>
              </div>
            </div>
            <div className="job-card" onClick={() => applyJob('Sales Associate', 'Luxe Brands')}>
              <div className="job-icon" style={{ background: 'rgba(232,200,74,0.08)' }}>🛍️</div>
              <div className="job-info">
                <div className="job-title">Sales Associate</div>
                <div className="job-meta">Luxe Brands • Mall • 5hr shift</div>
                <span className="job-badge badge-new">New</span>
              </div>
              <div>
                <div className="job-pay">$17/hr</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-inner">
          <span className="marquee-item">Retail <span className="dot">◆</span></span>
          <span className="marquee-item">Warehousing <span className="dot">◆</span></span>
          <span className="marquee-item">Delivery <span className="dot">◆</span></span>
          <span className="marquee-item">Sales <span className="dot">◆</span></span>
          <span className="marquee-item">Stocking <span className="dot">◆</span></span>
          <span className="marquee-item">Packing <span className="dot">◆</span></span>
          <span className="marquee-item">Driving <span className="dot">◆</span></span>
          <span className="marquee-item">Customer Service <span className="dot">◆</span></span>
          <span className="marquee-item">Retail <span className="dot">◆</span></span>
          <span className="marquee-item">Warehousing <span className="dot">◆</span></span>
          <span className="marquee-item">Delivery <span className="dot">◆</span></span>
          <span className="marquee-item">Sales <span className="dot">◆</span></span>
          <span className="marquee-item">Stocking <span className="dot">◆</span></span>
          <span className="marquee-item">Packing <span className="dot">◆</span></span>
          <span className="marquee-item">Driving <span className="dot">◆</span></span>
          <span className="marquee-item">Customer Service <span className="dot">◆</span></span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-tag">// How It Works</div>
        <div className="section-title">Simple as <span className="g">Three Steps</span></div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-icon">⚡</div>
            <div className="how-title">Sign Up Free</div>
            <p className="how-desc">Create your FreeMason profile in under 3 minutes. Add your availability, skills, and location. No resume needed.</p>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-icon">🎯</div>
            <div className="how-title">Browse Daily Shifts</div>
            <p className="how-desc">New jobs posted every day by local businesses. Filter by industry, pay rate, hours, and distance from you.</p>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-icon">💰</div>
            <div className="how-title">Work & Get Paid</div>
            <p className="how-desc">Show up, do the work, get paid. Fast payouts direct to your account. Build your rep and unlock better shifts.</p>
          </div>
        </div>
      </section>

      {/* ROLES SPLIT */}
      <div className="roles" id="business">
        <div className="role-card worker">
          <div className="role-bg-text">WORKER</div>
          <div className="role-eyebrow">// For Workers</div>
          <div className="role-title">YOU SET<br />THE TERMS</div>
          <ul className="role-features">
            <li>Browse daily shifts that fit your schedule</li>
            <li>Retail, sales, warehouse & delivery roles</li>
            <li>Instant apply — no cover letters</li>
            <li>Track earnings and build your reputation</li>
            <li>Get discovered by top local businesses</li>
          </ul>
          <Link to={isLoggedIn ? getDashboardLink() : "/register"} className="btn-primary">Find Shifts →</Link>
        </div>
        <div className="role-card business">
          <div className="role-bg-text">BIZ</div>
          <div className="role-eyebrow">// For Businesses</div>
          <div className="role-title">FILL SHIFTS<br />FAST</div>
          <ul className="role-features">
            <li>Post daily or recurring shift openings in minutes</li>
            <li>Access a pool of pre-vetted local workers</li>
            <li>Filter by rating, experience & availability</li>
            <li>Manage bookings from one dashboard</li>
            <li>Scale your team up or down instantly</li>
          </ul>
          <button className="btn-primary" style={{ background: 'var(--orange)', border: 'none', cursor: 'pointer' }} onClick={() => navigate(isLoggedIn ? getDashboardLink() : '/register')}>Post a Shift →</button>
        </div>
      </div>

      {/* JOB BOARD */}
      <section className="job-board-section" id="jobs">
        <div className="section-tag">// Live Job Board</div>
        <div className="section-title">Today's <span className="g">Open Shifts</span></div>
        <div className="filters">
          <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>All</button>
          <button className={`filter-btn ${activeFilter === 'retail' ? 'active' : ''}`} onClick={() => setActiveFilter('retail')}>Retail & Sales</button>
          <button className={`filter-btn ${activeFilter === 'warehouse' ? 'active' : ''}`} onClick={() => setActiveFilter('warehouse')}>Warehousing</button>
          <button className={`filter-btn ${activeFilter === 'delivery' ? 'active' : ''}`} onClick={() => setActiveFilter('delivery')}>Delivery</button>
        </div>
        <div className="job-grid">
          {filteredJobs.map((j) => (
            <div key={j.id} className="jb-card">
              {j.urgent && <span className="jb-urgent">Urgent</span>}
              <div className="jb-top">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div className="jb-company-icon" style={{ background: j.bg }}>{j.icon}</div>
                  <div>
                    <div className="jb-title">{j.title}</div>
                    <div className="jb-company">{j.company} · {j.location}</div>
                  </div>
                </div>
              </div>
              <div className="jb-details">
                <span className="jb-tag">⏱ {j.hours}</span>
                {j.tags.map((t, idx) => <span key={idx} className="jb-tag">{t}</span>)}
              </div>
              <div className="jb-footer">
                <div className="jb-pay">{j.pay}<span>{j.unit}</span></div>
                <button className="apply-btn" onClick={() => applyJob(j.title, j.company)}>Apply Now</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <div className="cta-band">
        <div className="cta-band-text">
          <h2>READY TO BUILD<br />SOMETHING?</h2>
          <p>Join thousands of workers already earning on their own terms.</p>
        </div>
        <Link to={isLoggedIn ? getDashboardLink() : "/register"} className="btn-dark">Create Free Account →</Link>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="logo">Free<span>Mason</span></div>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">For Business</a>
          <a href="#">Support</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <div className="footer-copy">© 2026 FreeMason. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
