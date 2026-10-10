
from pathlib import Path

import pandas as pd

from backend.preferences import extract_preferences


# Find the project folder and fragrance catalog.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CATALOG_PATH = PROJECT_ROOT / "data" / "fragrances.csv"


def load_catalog():
    """Load the fragrance catalog from the CSV file."""
    return pd.read_csv(CATALOG_PATH)


def recommend_fragrances(
    catalog,
    budget=float("inf"),
    occasion=None,
    scent_family=None,
    min_longevity=0,
    scent_preferences=None,
):
    """Filter and rank fragrances based on customer preferences."""

    results = catalog.copy()

    # 1. Filter by budget.
    results = results[results["price_aed"] <= budget]

    # 2. Filter by minimum longevity.
    results = results[
        results["longevity_hours"] >= min_longevity
    ]

    # 3. Filter by occasion.
    if occasion:
        results = results[
            results["occasion"].str.lower() == occasion.lower()
        ]

    # 4. Match scent family and related fragrance notes.
    scent_keywords = {
        "gourmand": [
            "gourmand", "vanilla", "caramel", "sweet", "pear"
        ],
        "oriental": [
            "oriental", "amber", "vanilla", "warm", "spicy"
        ],
        "woody": [
            "woody", "wood", "cedarwood", "sandalwood", "patchouli"
        ],
        "floral": [
            "floral", "rose", "jasmine", "flower"
        ],
        "citrus": [
            "citrus", "lemon", "bergamot", "orange"
        ],
        "aquatic": [
            "aquatic", "ocean", "sea salt"
        ],
        "musky": [
            "musky", "musk"
        ],
        "spicy": [
            "spicy", "cinnamon", "cardamom", "oud"
        ],
        "fruity floral": [
            "fruity", "fruit", "mango", "peach", "jasmine"
        ],
    }

    # Support multiple scent preferences when supplied.
    requested_scents = []

    if scent_family:
        requested_scents.append(scent_family.lower())

    if scent_preferences:
        requested_scents.extend(
            scent.lower() for scent in scent_preferences
        )

    if requested_scents:
        # Combine product fields so we can check family, notes,
        # and descriptions together.
        searchable_text = (
            results["scent_family"].fillna("").astype(str)
            + " "
            + results["notes"].fillna("").astype(str)
            + " "
            + results["description"].fillna("").astype(str)
        ).str.lower()

        def matches_scent(product_text):
            for scent in requested_scents:
                keywords = scent_keywords.get(scent, [scent])

                if any(
                    keyword in product_text
                    for keyword in keywords
                ):
                    return True

            return False

        results = results[
            searchable_text.apply(matches_scent)
        ]

    # IMPORTANT: Return results regardless of whether a scent
    # preference was provided.
    return results.sort_values(
        by=["longevity_hours", "price_aed"],
        ascending=[False, True],
    )


def recommend_from_message(message, catalog):
    """Extract preferences and recommend matching fragrances."""

    preferences = extract_preferences(message)

    # If no budget was given, don't impose a price limit.
    budget = preferences.get("budget")
    if budget is None:
        budget = float("inf")

    # Map descriptive words to scent preferences.
    text = message.lower()
    scent_preferences = []

    if any(word in text for word in [
        "sweet", "vanilla", "caramel", "sugary"
    ]):
        scent_preferences.append("gourmand")

    if any(word in text for word in [
        "warm", "amber", "cozy"
    ]):
        scent_preferences.append("oriental")

    # Pass the extracted preferences to the recommendation engine.
    return recommend_fragrances(
        catalog=catalog,
        budget=budget,
        occasion=preferences.get("occasion"),
        scent_family=None,
        min_longevity=preferences.get("min_longevity", 0),
        scent_preferences=scent_preferences,
    )


def main():
    """Run the natural-language fragrance recommendation demo."""

    catalog = load_catalog()
    print("\n=== AI Fragrance Store ===")
    print(f"Loaded {len(catalog)} fragrances.")

    message = input(
        "\nDescribe the fragrance you want: "
    ).strip()

    results = recommend_from_message(message, catalog)

    if results.empty:
        print("\nNo fragrances matched all your preferences.")
        print("Try relaxing one of your preferences.")
        return

    print("\n=== Recommended Fragrances ===")

    for _, perfume in results.iterrows():
        print(f"\n{perfume['name']} — {perfume['brand']}")
        print(f"  Scent family: {perfume['scent_family']}")
        print(f"  Notes: {perfume['notes']}")
        print(f"  Occasion: {perfume['occasion']}")
        print(f"  Longevity: {perfume['longevity_hours']} hours")
        print(f"  Price: AED {perfume['price_aed']}")
        print(f"  Why it may fit: {perfume['description']}")


if __name__ == "__main__":
    main()
