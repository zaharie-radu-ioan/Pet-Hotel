import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AccountMenu from "../components/AccountMenu";
import "./HomePage.css";

const FEATURES = [
  {
    title: "Cozy stay",
    subtitle: "Everything they need.",
    points: ["Cozy private room",
      "3 meals per day",
      "2 outdoor walks per day",
      "Fresh water",
      "Daily care & supervision",],
  },
  {
    title: "Happy stay",
    subtitle: "More play, more comfort.",
    points: ["Premium private room",
      "3 meals per day",
      "3 outdoor walks per day",
      "Personalized sleeping area",
      "Extra one-on-one attention",],
  },
  {
    title: "Premium stay",
    subtitle: "Because your pet deserves the best.",
    points: ["Luxury private suite",
      "4 outdoor walks per day",
      "Private playtime",
      "One spa session",
      "Personalized rest schedule",
      "Dedicated one-on-one care",],
  },
];

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Overview", "Pricing", "Rooms"] },
  { title: "Learn more", links: ["About", "Blog", "FAQ"] },
  { title: "Support", links: ["Contact", "Help center", "Terms"] },
];

export default function HomePage() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="home">
      <header className="home-nav">
        <Link to="/" className="home-brand" style={{ color: "inherit", textDecoration: "none" }}>
          <span className="home-brand-mark" aria-hidden="true">{"\u{1F43E}"}</span>
          Pet Hotel
        </Link>
        <nav className="home-nav-links">
          <a href="/dashboard">Dashboard</a>
          <a href="#location">Contact</a>
          {user ? (
            <AccountMenu variant="dark" />
          ) : (
            <>
              <Link to="/signup">Sign up</Link>
              <Link to="/login" className="home-btn home-btn--dark home-btn--sm">
                Log in
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h1>
            A Happy Place for Your
            <br />
            Best Friend.
          </h1>
          <p>
            Book a comfortable stay for your companion - safe rooms, daily play,
            and people who treat them like family while you are away.
          </p>
          <Link
            to={user ? "/rezervari" : "/signup"}
            className={`home-btn home-btn--dark${loading ? " is-disabled" : ""}`}
            aria-disabled={loading}
            tabIndex={loading ? -1 : undefined}
            onClick={(e) => {
            if (loading) e.preventDefault();
            }}
          >
            Book a stay
          </Link>
        </div>

        <div className="hero-image">
          <img src="/dog-illustration.png" alt="Happy dog" />
        </div>
      </section>

      <section className="features" id="features">
        {FEATURES.map((f) => (
          <article className="feature-card" key={f.title}>
            <h3>{f.title}</h3>
            <p className="feature-sub">{f.subtitle}</p>
            <ul>
              {f.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            
            <div className="feature-image" aria-hidden="true" />
          </article>
        ))}
      </section>

      <section className="location" id="location">
        <div className="location-text">
          <h2>
            Close to home.
            <br />
            Feels like home.
          </h2>
          <p>
            Our pet hotel sits in a quiet, pet-friendly neighborhood, surrounded
            by parks and open space for walks and adventures.
          </p>
          <p className="location-address">12 Example Blvd, Bucharest 010000</p>
          <a
            className="home-btn home-btn--dark"
            href="https://www.google.com/maps/search/?api=1&query=Pet+Hotel+Bucuresti"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Maps
          </a>
        </div>

        <div className="location-map">
          <svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true">
            <path fill="#4285F4" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
            <circle cx="12" cy="9" r="2.6" fill="#ffffff" />
          </svg>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-brand">
          <div className="home-brand">Pet Hotel</div>
          <p>A happy place for your best friend.</p>
        </div>

        <div className="footer-cols">
          {FOOTER_COLUMNS.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              {col.links.map((link) => (
                <a href="#" key={link}>{link}</a>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-social">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="LinkedIn">in</a>
          <a href="#" aria-label="X">x</a>
        </div>
      </footer>
    </div>
  );
}