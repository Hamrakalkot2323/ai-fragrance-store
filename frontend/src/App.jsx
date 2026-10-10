
import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const perfumeImages = {
  "Fresh Citrus": "/images/fresh-citrus.jpg",
  "Velvet Rose": "/images/velvet-rose.jpg",
  "Ocean Drift": "/images/ocean-drift.jpg",
  "Amber Nights": "/images/amber-nights.jpg",
  "Green Escape": "/images/green-escape.jpg",
  "Sweet Cloud": "/images/sweet-cloud.jpg",
  "Spice Route": "/images/spice-route.jpg",
  "Soft Musk": "/images/soft-musk.jpg",
  "Tropical Bloom": "/images/tropical-bloom.jpg",
  "Midnight Woods": "/images/midnight-woods.jpg",
};

function formatPerfume(perfume) {
  return {
    ...perfume,
    price: perfume.price_aed,
    family: perfume.scent_family,
    color: "#d8c0a1",
    emoji: "✨",
  };
}

function App() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [selectedPerfume, setSelectedPerfume] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFavorites = localStorage.getItem("hemorea-favorites");
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch {
      return [];
    }
  });

  const [perfumes, setPerfumes] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  // Save favourites whenever they change.
  useEffect(() => {
    localStorage.setItem("hemorea-favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Load the perfume catalogue from FastAPI.
  useEffect(() => {
    loadPerfumes();
  }, []);

  async function loadPerfumes() {
    setCatalogLoading(true);
    setCatalogError("");

    try {
      const response = await fetch(`${API_URL}/perfumes`);

      if (!response.ok) {
        throw new Error("Could not load the perfume collection.");
      }

      const data = await response.json();
      setPerfumes((data.perfumes || []).map(formatPerfume));
    } catch (err) {
      console.error("Catalogue loading error:", err);
      setCatalogError(
        "We couldn't connect to the perfume collection. Please check that the backend is running."
      );
    } finally {
      setCatalogLoading(false);
    }
  }

  // Add or remove a fragrance from favourites.
  function toggleFavorite(perfume) {
    setFavorites((currentFavorites) => {
      const alreadySaved = currentFavorites.some(
        (item) => item.name === perfume.name
      );

      if (alreadySaved) {
        return currentFavorites.filter(
          (item) => item.name !== perfume.name
        );
      }

      return [...currentFavorites, perfume];
    });
  }

  // Check whether a fragrance is already saved.
  function isFavorite(perfume) {
    return favorites.some((item) => item.name === perfume.name);
  }

  // Open a perfume's detail page.
  function openPerfume(perfume) {
    setSelectedPerfume(perfume);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Return to the main store.
  function backToCollection() {
    setSelectedPerfume(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Request AI fragrance recommendations.
  async function handleSubmit(event) {
    event.preventDefault();

    if (!query.trim()) {
      setError("Tell us a little about the fragrance you want.");
      setRecommendations([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setRecommendations([]);
    setSearched(true);

    try {
      const response = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Something went wrong. Please try again."
        );
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Fragrance recommendation error:", err);

      setError(
        err.message === "Failed to fetch"
          ? "We couldn't connect to the fragrance AI. Please check that your backend is running."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="store">
      {/* NAVIGATION */}
      <header className="navbar">
        <a
          className="logo"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            backToCollection();
          }}
        >
          HEMOREA<span>.</span>
        </a>

        <nav>
          <a
            href="#collection"
            onClick={(event) => {
              event.preventDefault();
              backToCollection();
              window.location.hash = "collection";
            }}
          >
            Collection
          </a>

          <a
            href="#ai-finder"
            onClick={(event) => {
              event.preventDefault();
              backToCollection();
              window.location.hash = "ai-finder";
            }}
          >
            AI Fragrance Finder
          </a>

          <a
            href="#favorites"
            onClick={(event) => {
              event.preventDefault();
              backToCollection();
              window.location.hash = "favorites";
            }}
          >
            Favourites ({favorites.length})
          </a>
        </nav>

        <a
          className="nav-cta"
          href="#ai-finder"
          onClick={(event) => {
            event.preventDefault();
            backToCollection();
            window.location.hash = "ai-finder";
          }}
        >
          Discover yours ↗
        </a>
      </header>

      <main>
        {selectedPerfume ? (
          /* INDIVIDUAL PERFUME DETAIL PAGE */
          <section className="product-detail">
            <button
              type="button"
              className="back-button"
              onClick={backToCollection}
            >
              ← Back to collection
            </button>

            <div className="product-detail-layout">
              <div className="product-detail-image">
                <img
                  src={
                    perfumeImages[selectedPerfume.name] ||
                    "/images/fresh-citrus.jpg"
                  }
                  alt={`${selectedPerfume.name} perfume bottle`}
                />
              </div>

              <div className="product-detail-info">
                <p className="eyebrow">{selectedPerfume.brand}</p>

                <h1>{selectedPerfume.name}</h1>

                <p className="product-detail-price">
                  AED {selectedPerfume.price ?? selectedPerfume.price_aed}
                </p>

                <p className="product-detail-description">
                  {selectedPerfume.description}
                </p>

                <div className="product-detail-divider" />

                <div className="product-detail-fact">
                  <span>Scent family</span>
                  <strong>
                    {selectedPerfume.family ??
                      selectedPerfume.scent_family ??
                      "Not specified"}
                  </strong>
                </div>

                <div className="product-detail-fact">
                  <span>Scent notes</span>
                  <strong>
                    {Array.isArray(selectedPerfume.notes)
                      ? selectedPerfume.notes.join(" · ")
                      : selectedPerfume.notes || "Not specified"}
                  </strong>
                </div>

                <div className="product-detail-fact">
                  <span>Occasion</span>
                  <strong>
                    {selectedPerfume.occasion || "Not specified"}
                  </strong>
                </div>

                <div className="product-detail-fact">
                  <span>Longevity</span>
                  <strong>
                    {selectedPerfume.longevity_hours != null
                      ? `${selectedPerfume.longevity_hours} hours`
                      : "Not specified"}
                  </strong>
                </div>

                <button
                  type="button"
                  className={
                    "favorite-button" +
                    (isFavorite(selectedPerfume) ? " is-favorite" : "")
                  }
                  onClick={() => toggleFavorite(selectedPerfume)}
                  aria-pressed={isFavorite(selectedPerfume)}
                >
                  {isFavorite(selectedPerfume)
                    ? "♥ Saved to favourites"
                    : "♡ Add to favourites"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* HERO SECTION */}
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">YOUR SCENT. YOUR STORY.</p>

                <h1>
                  Find the scent
                  <br />
                  that feels like <em>you.</em>
                </h1>

                <p className="hero-description">
                  Explore fragrances that match your mood, your moments,
                  and the little things that make you unique.
                </p>

                <a className="primary-button" href="#ai-finder">
                  Find your fragrance <span>↗</span>
                </a>

                <div className="hero-note">
                  <span className="note-dot" />
                  Thoughtfully matched to your preferences
                </div>
              </div>

              <div
                className="hero-art"
                aria-label="Fragrance collection illustration"
              >
                <div className="art-glow" />

                <div className="art-label">
                  EAU DE PARFUM
                  <br />
                  COLLECTION Nº 01
                </div>

                <div className="bottle bottle-back">
                  <div className="bottle-cap" />
                  <div className="bottle-neck" />
                  <div className="bottle-body">
                    <span>NOOR</span>
                    <small>AMBER · WOODS</small>
                  </div>
                </div>

                <div className="bottle bottle-front">
                  <div className="bottle-cap" />
                  <div className="bottle-neck" />
                  <div className="bottle-body">
                    <span>HEMOREA</span>
                    <small>PARFUM</small>
                  </div>
                </div>

                <div className="art-caption">
                  SCENT IS A MEMORY
                  <br />
                  WAITING TO HAPPEN.
                </div>
              </div>
            </section>

            {/* FRAGRANCE COLLECTION */}
            <section className="collection" id="collection">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">CURATED FOR YOU</p>
                  <h2>
                    A world of <em>fragrance.</em>
                  </h2>
                </div>

                <p className="section-side-note">
                  Little bottles. Lasting impressions.
                </p>
              </div>

              {catalogLoading ? (
                <p className="collection-message" role="status">
                  Discovering your fragrances...
                </p>
              ) : catalogError ? (
                <div
                  className="collection-message collection-error"
                  role="alert"
                >
                  <p>{catalogError}</p>
                  <button
                    type="button"
                    className="favorite-button"
                    onClick={loadPerfumes}
                  >
                    Try again
                  </button>
                </div>
              ) : perfumes.length === 0 ? (
                <p className="collection-message">
                  No fragrances are available just yet. Please check back
                  soon.
                </p>
              ) : (
                <div className="perfume-grid">
                  {perfumes.map((perfume) => (
                    <article
                      className="perfume-card"
                      key={perfume.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openPerfume(perfume)}
                      onKeyDown={(event) => {
                        if (
                          event.target === event.currentTarget &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          openPerfume(perfume);
                        }
                      }}
                    >
                      <div className="perfume-art">
                        <img
                          className="perfume-photo"
                          src={
                            perfumeImages[perfume.name] ||
                            "/images/fresh-citrus.jpg"
                          }
                          alt={`${perfume.name} perfume bottle`}
                          loading="lazy"
                        />
                      </div>

                      <div className="card-info">
                        <div className="card-title-row">
                          <div>
                            <p className="brand-name">{perfume.brand}</p>
                            <h3>{perfume.name}</h3>
                          </div>

                          <p className="price">AED {perfume.price}</p>
                        </div>

                        <p className="notes">
                          {Array.isArray(perfume.notes)
                            ? perfume.notes.join(" · ")
                            : perfume.notes}
                        </p>

                        <p className="card-description">
                          {perfume.description}
                        </p>

                        <button
                          type="button"
                          className={
                            "favorite-button" +
                            (isFavorite(perfume) ? " is-favorite" : "")
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavorite(perfume);
                          }}
                          aria-pressed={isFavorite(perfume)}
                        >
                          {isFavorite(perfume)
                            ? "♥ Saved to favourites"
                            : "♡ Add to favourites"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* FAVOURITES SECTION */}
            <section className="favorites-section" id="favorites">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR PERSONAL COLLECTION</p>
                  <h2>
                    Your <em>favourites.</em>
                  </h2>
                </div>

                <p className="section-side-note">
                  {favorites.length}{" "}
                  {favorites.length === 1 ? "fragrance" : "fragrances"} saved
                </p>
              </div>

              {favorites.length === 0 ? (
                <div className="favorites-empty">
                  <span className="favorites-empty-icon">♡</span>
                  <h3>Your collection starts here.</h3>
                  <p>
                    Save the fragrances you love, and they’ll appear here
                    for you to revisit.
                  </p>
                  <a className="primary-button" href="#collection">
                    Explore the collection ↗
                  </a>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favorites.map((perfume) => (
                    <article
                      className="favorite-card"
                      key={perfume.id ?? perfume.name}
                    >
                      <div className="favorite-card-heading">
                        <div>
                          <p className="brand-name">{perfume.brand}</p>
                          <h3>{perfume.name}</h3>
                        </div>

                        <span className="favorite-heart">♥</span>
                      </div>

                      <p className="notes">
                        {Array.isArray(perfume.notes)
                          ? perfume.notes.join(" · ")
                          : perfume.notes}
                      </p>

                      <p className="price">
                        AED {perfume.price ?? perfume.price_aed}
                      </p>

                      <button
                        type="button"
                        className="favorite-button is-favorite"
                        onClick={() => toggleFavorite(perfume)}
                      >
                        ♥ Remove from favourites
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* AI FRAGRANCE FINDER */}
            <section className="ai-finder" id="ai-finder">
              <div className="finder-decoration">✳</div>

              <p className="eyebrow">A LITTLE HELP FROM AI</p>

              <h2>
                Your next signature scent
                <br />
                starts with <em>a feeling.</em>
              </h2>

              <p className="finder-description">
                Tell us what you love, where you're going, or how you want
                to feel. We'll find fragrances worth discovering.
              </p>

              <form className="finder-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. Warm, sweet perfume for dinner under AED 300..."
                  aria-label="Describe your ideal fragrance"
                  disabled={loading}
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Finding your scent..." : "Find my scent ↗"}
                </button>
              </form>

              {loading && (
                <div className="finder-status" role="status">
                  <span className="loading-spinner" />
                  Finding fragrances that match your preferences...
                </div>
              )}

              {error && (
                <p className="finder-error" role="alert">
                  {error}
                </p>
              )}

              {!loading &&
                searched &&
                !error &&
                recommendations.length === 0 && (
                  <div className="recommendation-results">
                    <h3>No matching fragrances found just yet.</h3>
                    <p>
                      Try adjusting your budget or describing a different
                      scent, occasion, or longevity preference.
                    </p>
                  </div>
                )}

              {!loading && recommendations.length > 0 && (
                <div className="recommendation-results" aria-live="polite">
                  <p className="eyebrow">SELECTED FOR YOUR TASTE</p>

                  <h3>
                    Your fragrance matches<span>.</span>
                  </h3>

                  <p className="results-intro">
                    Based on your preferences, here are the fragrances
                    our recommendation engine found for you.
                  </p>

                  <div className="recommendation-grid">
                    {recommendations.map((perfume) => (
                      <article
                        className="recommendation-card"
                        key={perfume.id}
                      >
                        <div className="recommendation-card-top">
                          <span className="recommendation-icon">✧</span>
                          <span className="recommendation-family">
                            {perfume.scent_family}
                          </span>
                        </div>

                        <p className="brand-name">{perfume.brand}</p>
                        <h4>{perfume.name}</h4>

                        <p className="recommendation-description">
                          {perfume.description}
                        </p>

                        <div className="recommendation-details">
                          <p>
                            <strong>Notes</strong>
                            <span>
                              {Array.isArray(perfume.notes)
                                ? perfume.notes.join(" · ")
                                : perfume.notes}
                            </span>
                          </p>

                          <p>
                            <strong>Occasion</strong>
                            <span>{perfume.occasion}</span>
                          </p>

                          <p>
                            <strong>Longevity</strong>
                            <span>
                              {perfume.longevity_hours != null
                                ? `${perfume.longevity_hours} hours`
                                : "Not specified"}
                            </span>
                          </p>
                        </div>

                        <div className="recommendation-card-footer">
                          <span className="price">
                            AED {perfume.price_aed}
                          </span>
                          <span className="match-label">AI MATCH</span>
                        </div>

                        <button
                          type="button"
                          className={
                            "favorite-button" +
                            (isFavorite(perfume) ? " is-favorite" : "")
                          }
                          onClick={() => toggleFavorite(perfume)}
                          aria-pressed={isFavorite(perfume)}
                        >
                          {isFavorite(perfume)
                            ? "♥ Saved to favourites"
                            : "♡ Add to favourites"}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              <p className="finder-footnote">
                MADE FOR YOUR TASTE · BUILT AROUND YOUR PREFERENCES
              </p>
            </section>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <a
          className="logo"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            backToCollection();
          }}
        >
          HEMOREA<span>.</span>
        </a>

        <p>Find the fragrance that feels like you.</p>

        <span>AN EXPLORATION IN SCENT © 2026</span>
      </footer>
    </div>
  );
}

export default App;

