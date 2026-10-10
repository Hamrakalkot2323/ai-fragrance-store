
from pathlib import Path

import pandas as pd
from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim

from backend.preferences import extract_preferences


PROJECT_ROOT = Path(__file__).resolve().parent.parent
CATALOG_PATH = PROJECT_ROOT / "data" / "fragrances.csv"

MODEL_NAME = "all-MiniLM-L6-v2"


def load_catalog():
    """Load fragrance products from the CSV catalog."""
    return pd.read_csv(CATALOG_PATH)


def create_product_text(catalog):
    """Combine product fields into text for semantic matching."""
    return (
        catalog["name"].fillna("").astype(str)
        + ". Scent family: "
        + catalog["scent_family"].fillna("").astype(str)
        + ". Notes: "
        + catalog["notes"].fillna("").astype(str)
        + ". Occasion: "
        + catalog["occasion"].fillna("").astype(str)
        + ". Description: "
        + catalog["description"].fillna("").astype(str)
    )


def recommend_semantically(message, catalog, model):
    """Filter products by explicit preferences and rank by meaning."""

    preferences = extract_preferences(message)
    results = catalog.copy()

    # Apply the budget only when the customer specified one.
    budget = preferences.get("budget")
    if budget is not None:
        results = results[results["price_aed"] <= budget]

    # Apply explicit occasion and longevity constraints.
    occasion = preferences.get("occasion")
    if occasion:
        results = results[
            results["occasion"].str.lower() == occasion.lower()
        ]

    min_longevity = preferences.get("min_longevity", 0)
    results = results[
        results["longevity_hours"] >= min_longevity
    ]

    if results.empty:
        return results.assign(similarity_score=pd.Series(dtype=float))

    # Encode the customer request and remaining product descriptions.
    query_embedding = model.encode(
        message,
        convert_to_tensor=True,
    )

    product_text = create_product_text(results)

    product_embeddings = model.encode(
        product_text.tolist(),
        convert_to_tensor=True,
    )

    scores = cos_sim(query_embedding, product_embeddings)[0]

    results = results.copy()
    results["similarity_score"] = scores.cpu().tolist()

    return results.sort_values(
        by="similarity_score",
        ascending=False,
    )


def main():
    print("Loading fragrance catalog...")
    catalog = load_catalog()

    print(f"Loaded {len(catalog)} fragrances.")
    print(f"Loading semantic model: {MODEL_NAME}")

    model = SentenceTransformer(MODEL_NAME)

    message = input(
        "\nDescribe the fragrance you want: "
    ).strip()

    if not message:
        print("Please enter a fragrance description.")
        return

    results = recommend_semantically(message, catalog, model)

    if results.empty:
        print("\nNo fragrances matched the explicit filters.")
        print("Try relaxing your budget, occasion, or longevity requirement.")
        return

    print("\n=== Semantic Fragrance Recommendations ===")

    for _, perfume in results.iterrows():
        print(
            f"\n{perfume['name']} — {perfume['brand']}"
        )
        print(f"  Price: AED {perfume['price_aed']}")
        print(f"  Scent family: {perfume['scent_family']}")
        print(f"  Notes: {perfume['notes']}")
        print(f"  Occasion: {perfume['occasion']}")
        print(f"  Longevity: {perfume['longevity_hours']} hours")
        print(
            f"  Similarity: {perfume['similarity_score']:.4f}"
        )
        print(f"  Description: {perfume['description']}")


if __name__ == "__main__":
    main()
