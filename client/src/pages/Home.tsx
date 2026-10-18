import "./Home.css";

type HomeProps = {
  onStartCreating: () => void;
};

function Home({ onStartCreating }: HomeProps) {
  return (
    <main className="home-page">
      <nav className="home-nav">
        <a href="/" className="brand">
          <span className="brand-mark">w.</span>
          <span>whiteboard</span>
        </a>

        <span className="nav-caption">A SPACE FOR YOUR IDEAS</span>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">
            YOUR SPACE. YOUR THOUGHTS. YOUR CANVAS.
          </p>

          <h1>
            Your ideas
            <br />
            deserve <span>space.</span>
          </h1>

          <p className="hero-description">
            A little room to think out loud, sketch something new, and turn the
            ideas in your head into something real.
          </p>

          <button className="start-button" onClick={onStartCreating}>
            Start creating <span aria-hidden="true">↗</span>
          </button>

          <p className="hero-footnote">No perfect plans needed. Just start.</p>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-note note-one">
            <span className="note-label">01 — THE THOUGHT</span>
            <p>
              What if
              <br />
              we tried
              <br />
              <em>something new?</em>
            </p>
            <span className="note-scribble">〰</span>
          </div>

          <div className="art-note note-two">
            <span className="note-label">A SMALL REMINDER</span>
            <p>
              Start messy.
              <br />
              Figure it out
              <br />
              along the way.
            </p>
            <span className="note-star">✳</span>
          </div>

          <svg className="art-arrow" viewBox="0 0 130 80" fill="none">
            <path
              d="M5 12 C 45 4, 70 22, 90 53"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="3 5"
            />
            <path
              d="M77 48 L90 54 L94 39"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span className="art-caption">A place to begin ↙</span>
        </div>
      </section>

      <footer className="home-footer">
        <span>MADE FOR THE WAY YOUR MIND WORKS.</span>
        <span>ONE CANVAS. ENDLESS POSSIBILITIES.</span>
      </footer>
    </main>
  );
}

export default Home;
