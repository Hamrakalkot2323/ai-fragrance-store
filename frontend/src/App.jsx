
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
    price: perfume.price_aed ?? perfume.price,
    family: perfume.scent_family ?? perfume.family,
    color: "#d8c0a1",
    emoji: "✨",
  };
}

function getPerfumeKey(perfume) {
  return String(perfume.id ?? perfume.name);
}

function getPerfumePrice(perfume) {
  return Number(perfume.price ?? perfume.price_aed ?? 0);
}

function formatAED(amount) {
  return `AED ${Number(amount).toFixed(2)}`;
}

function App() {
  // AI fragrance finder
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Product details and shopping cart
  const [selectedPerfume, setSelectedPerfume] = useState(null);
  const [showCart, setShowCart] = useState(false);

  // Collection search and filters
  const [collectionSearch, setCollectionSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("All");
  const [selectedOccasion, setSelectedOccasion] = useState("All");
  const [maxPrice, setMaxPrice] = useState("All");
  const [sortOrder, setSortOrder] = useState("featured");

  // Load saved favourites from localStorage.
  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFavorites = localStorage.getItem("hemorea-favorites");
      const parsed = savedFavorites ? JSON.parse(savedFavorites) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Load the saved shopping cart.
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("hemorea-cart");
      const parsed = savedCart ? JSON.parse(savedCart) : [];

      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((item) => item && item.name)
        .map((item) => ({
          ...item,
          quantity: Math.max(
            1,
            Math.floor(Number(item.quantity) || 1)
          ),
        }));
    } catch {
      return [];
    }
  });

  // Catalogue from the FastAPI backend.
  const [perfumes, setPerfumes] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  // Persist favourites.
  useEffect(() => {
    localStorage.setItem(
      "hemorea-favorites",
      JSON.stringify(favorites)
    );
  }, [favorites]);

  // Persist the cart.
  useEffect(() => {
    localStorage.setItem("hemorea-cart", JSON.stringify(cart));
  }, [cart]);

  // Load the perfume catalogue on startup.
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

      setPerfumes(
        (data.perfumes || []).map(formatPerfume)
      );
    } catch (err) {
      console.error("Catalogue loading error:", err);

      setCatalogError(
        "We couldn't connect to the perfume collection. Please check that the backend is running."
      );
    } finally {
      setCatalogLoading(false);
    }
  }

  // Build filter options automatically from the catalogue.
  const scentFamilies = [
    "All",
    ...new Set(
      perfumes
        .map((perfume) => perfume.family)
        .filter(Boolean)
    ),
  ].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  const occasions = [
    "All",
    ...new Set(
      perfumes
        .map((perfume) => perfume.occasion)
        .filter(Boolean)
    ),
  ].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  // Search, filter and sort the collection.
  const filteredPerfumes = perfumes
    .filter((perfume) => {
      const searchText = collectionSearch.trim().toLowerCase();

      const searchableFields = [
        perfume.name,
        perfume.brand,
        perfume.family,
        perfume.notes,
        perfume.description,
        perfume.occasion,
      ];

      const matchesSearch =
        !searchText ||
        searchableFields
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(searchText)
          );

      const matchesFamily =
        selectedFamily === "All" ||
        perfume.family === selectedFamily;

      const matchesOccasion =
        selectedOccasion === "All" ||
        perfume.occasion === selectedOccasion;

      const matchesPrice =
        maxPrice === "All" ||
        getPerfumePrice(perfume) <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesFamily &&
        matchesOccasion &&
        matchesPrice
      );
    })
    .sort((a, b) => {
      if (sortOrder === "price-low") {
        return getPerfumePrice(a) - getPerfumePrice(b);
      }

      if (sortOrder === "price-high") {
        return getPerfumePrice(b) - getPerfumePrice(a);
      }

      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }

      return 0;
    });

  // Reset all collection filters.
  function resetFilters() {
    setCollectionSearch("");
    setSelectedFamily("All");
    setSelectedOccasion("All");
    setMaxPrice("All");
    setSortOrder("featured");
  }

  // Favourites functionality.
  function toggleFavorite(perfume) {
    setFavorites((currentFavorites) => {
      const alreadySaved = currentFavorites.some(
        (item) =>
          getPerfumeKey(item) === getPerfumeKey(perfume)
      );

      if (alreadySaved) {
        return currentFavorites.filter(
          (item) =>
            getPerfumeKey(item) !== getPerfumeKey(perfume)
        );
      }

      return [...currentFavorites, perfume];
    });
  }

  function isFavorite(perfume) {
    return favorites.some(
      (item) =>
        getPerfumeKey(item) === getPerfumeKey(perfume)
    );
  }

  // Add a perfume to the cart or increase its quantity.
  function addToCart(perfume) {
    const cartPerfume = {
      ...perfume,
      price: getPerfumePrice(perfume),
      family: perfume.family ?? perfume.scent_family,
      quantity: 1,
    };

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) =>
          getPerfumeKey(item) === getPerfumeKey(cartPerfume)
      );

      if (existingItem) {
        return currentCart.map((item) =>
          getPerfumeKey(item) === getPerfumeKey(cartPerfume)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, cartPerfume];
    });
  }

  // Update the quantity of a cart item.
  function updateCartQuantity(perfume, newQuantity) {
    if (newQuantity < 1) {
      removeFromCart(perfume);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        getPerfumeKey(item) === getPerfumeKey(perfume)
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }

  // Remove a perfume from the cart.
  function removeFromCart(perfume) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          getPerfumeKey(item) !== getPerfumeKey(perfume)
      )
    );
  }

  // Cart totals.
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + getPerfumePrice(item) * item.quantity,
    0
  );

  // Navigation helpers.
  function openPerfume(perfume) {
    setShowCart(false);
    setSelectedPerfume(formatPerfume(perfume));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToCollection() {
    setSelectedPerfume(null);
    setShowCart(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCart() {
    setSelectedPerfume(null);
    setShowCart(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Ask the backend for AI fragrance recommendations.
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

        <div className="navbar-actions">
          <button
            type="button"
            className="nav-cart-button"
            onClick={openCart}
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            ♡ Cart <span className="cart-count">{cartCount}</span>
          </button>

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
        </div>
      </header>

      <main>
        {showCart ? (
          /* SHOPPING CART */
          <section className="cart-page">
            <button
              type="button"
              className="back-button"
              onClick={backToCollection}
            >
              ← Continue shopping
            </button>

            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR PERSONAL SELECTION</p>
                <h2>
                  Your <em>shopping bag.</em>
                </h2>
              </div>

              <p className="section-side-note">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty-icon">♡</span>
                <h3>Your bag is waiting for a little fragrance.</h3>
                <p>
                  Explore our collection and add a scent that feels like you.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={backToCollection}
                >
                  Explore fragrances ↗
                </button>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="cart-items">
                  {cart.map((item) => (
                    <article
                      className="cart-item"
                      key={getPerfumeKey(item)}
                    >
                      <button
                        type="button"
                        className="cart-item-image"
                        onClick={() => openPerfume(item)}
                        aria-label={`View ${item.name}`}
                      >
                        <img
                          src={
                            perfumeImages[item.name] ||
                            "/images/fresh-citrus.jpg"
                          }
                          alt={`${item.name} perfume bottle`}
                        />
                      </button>

                      <div className="cart-item-info">
                        <p className="brand-name">{item.brand}</p>

                        <button
                          type="button"
                          className="cart-product-name"
                          onClick={() => openPerfume(item)}
                        >
                          {item.name}
                        </button>

                        <p className="cart-item-family">
                          {item.family || "Fragrance"}
                        </p>

                        <p className="cart-item-price">
                          {formatAED(getPerfumePrice(item))}
                        </p>

                        <div className="cart-quantity">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item, item.quantity - 1)
                            }
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            −
                          </button>

                          <span aria-live="polite">{item.quantity}</span>

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item, item.quantity + 1)
                            }
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove-button"
                          onClick={() => removeFromCart(item)}
                        >
                          Remove
                        </button>
                      </div>

                      <p className="cart-line-total">
                        {formatAED(
                          getPerfumePrice(item) * item.quantity
                        )}
                      </p>
                    </article>
                  ))}
                </div>

                <aside className="cart-summary">
                  <p className="eyebrow">YOUR ORDER</p>
                  <h3>Order summary</h3>

                  <div className="cart-summary-row">
                    <span>Items ({cartCount})</span>
                    <span>{formatAED(cartTotal)}</span>
                  </div>

                  <div className="cart-summary-row">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>

                  <div className="cart-summary-total">
                    <span>Subtotal</span>
                    <strong>{formatAED(cartTotal)}</strong>
                  </div>

                  <p className="cart-summary-note">
                    Shipping and applicable fees are not included.
                  </p>

                  <button
                    type="button"
                    className="cart-checkout-button"
                    onClick={() =>
                      window.alert(
                        "Your cart is ready! Online checkout and payments will be added in a future step."
                      )
                    }
                  >
                    Proceed to checkout ↗
                  </button>

                  <button
                    type="button"
                    className="cart-clear-button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to remove all items from your cart?"
                        )
                      ) {
                        setCart([]);
                      }
                    }}
                  >
                    Clear cart
                  </button>
                </aside>
              </div>
            )}
          </section>
        ) : selectedPerfume ? (
          /* PERFUME DETAIL PAGE */
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
                  {formatAED(getPerfumePrice(selectedPerfume))}
                </p>

                <p className="product-detail-description">
                  {selectedPerfume.description}
                </p>

                <div className="product-detail-divider" />

                <div className="product-detail-fact">
                  <span>Scent family</span>
                  <strong>
                    {selectedPerfume.family ||
                      selectedPerfume.scent_family ||
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
                  className="cart-add-button"
                  onClick={() => addToCart(selectedPerfume)}
                >
                  Add to bag · {formatAED(getPerfumePrice(selectedPerfume))}
                </button>

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
            {/* HERO */}
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

              {/* SEARCH AND FILTER TOOLBAR */}
              <div className="collection-toolbar">
                <div className="collection-search">
                  <span aria-hidden="true">⌕</span>

                  <input
                    type="search"
                    value={collectionSearch}
                    onChange={(event) =>
                      setCollectionSearch(event.target.value)
                    }
                    placeholder="Search perfumes, brands or notes..."
                    aria-label="Search the perfume collection"
                  />

                  {collectionSearch && (
                    <button
                      type="button"
                      onClick={() => setCollectionSearch("")}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="collection-filters">
                  <label>
                    <span>Scent family</span>

                    <select
                      value={selectedFamily}
                      onChange={(event) =>
                        setSelectedFamily(event.target.value)
                      }
                    >
                      {scentFamilies.map((family) => (
                        <option key={family} value={family}>
                          {family === "All" ? "All families" : family}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Occasion</span>

                    <select
                      value={selectedOccasion}
                      onChange={(event) =>
                        setSelectedOccasion(event.target.value)
                      }
                    >
                      {occasions.map((occasion) => (
                        <option key={occasion} value={occasion}>
                          {occasion === "All"
                            ? "All occasions"
                            : occasion}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Maximum price</span>

                    <select
                      value={maxPrice}
                      onChange={(event) =>
                        setMaxPrice(event.target.value)
                      }
                    >
                      <option value="All">Any budget</option>
                      <option value="150">Up to AED 150</option>
                      <option value="200">Up to AED 200</option>
                      <option value="250">Up to AED 250</option>
                      <option value="300">Up to AED 300</option>
                    </select>
                  </label>

                  <label>
                    <span>Sort by</span>

                    <select
                      value={sortOrder}
                      onChange={(event) =>
                        setSortOrder(event.target.value)
                      }
                    >
                      <option value="featured">Featured order</option>
                      <option value="price-low">
                        Price: low to high
                      </option>
                      <option value="price-high">
                        Price: high to low
                      </option>
                      <option value="name">Name: A–Z</option>
                    </select>
                  </label>
                </div>

                <div className="collection-toolbar-footer">
                  <p className="collection-results-count" aria-live="polite">
                    Showing {filteredPerfumes.length} of {perfumes.length}{" "}
                    fragrances
                  </p>

                  {(collectionSearch ||
                    selectedFamily !== "All" ||
                    selectedOccasion !== "All" ||
                    maxPrice !== "All" ||
                    sortOrder !== "featured") && (
                    <button
                      type="button"
                      className="clear-filters-button"
                      onClick={resetFilters}
                    >
                      Reset search & filters ↺
                    </button>
                  )}
                </div>
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
              ) : filteredPerfumes.length === 0 ? (
                <div className="collection-message">
                  <h3>No fragrances found.</h3>
                  <p>
                    Try a different search, scent family, occasion, or budget.
                  </p>
                  <button
                    type="button"
                    className="favorite-button"
                    onClick={resetFilters}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="perfume-grid">
                  {filteredPerfumes.map((perfume) => (
                    <article
                      className="perfume-card"
                      key={getPerfumeKey(perfume)}
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

                          <p className="price">
                            {formatAED(getPerfumePrice(perfume))}
                          </p>
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
                          className="cart-add-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCart(perfume);
                          }}
                        >
                          + Add to bag
                        </button>

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

            {/* FAVOURITES */}
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
                      key={getPerfumeKey(perfume)}
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
                        {formatAED(getPerfumePrice(perfume))}
                      </p>

                      <button
                        type="button"
                        className="cart-add-button"
                        onClick={() => addToCart(perfume)}
                      >
                        + Add to bag
                      </button>

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
                        key={getPerfumeKey(perfume)}
                      >
                        <div className="recommendation-card-top">
                          <span className="recommendation-icon">✧</span>
                          <span className="recommendation-family">
                            {perfume.scent_family ?? perfume.family}
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
                            {formatAED(getPerfumePrice(perfume))}
                          </span>
                          <span className="match-label">AI MATCH</span>
                        </div>

                        <button
                          type="button"
                          className="cart-add-button"
                          onClick={() => addToCart(perfume)}
                        >
                          + Add to bag
                        </button>

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


