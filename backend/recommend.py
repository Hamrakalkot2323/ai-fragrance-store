
from pathlib import Path
import pandas as pd


# Find the catalog relative to this Python file
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CATALOG_PATH = PROJECT_ROOT / "data" / "fragrances.csv"


def load_catalog():
    """Load the fragrance catalog from the CSV file."""
    return pd.read_csv(CATALOG_PATH)


def recommend_fragrances(
    catalog,
    budget,
    occasion=None,
    scent_family=None,
    min_longevity=0,
):
    """Filter fragrances according to the user's preferences."""

    results = catalog[catalog["price_aed"] <= budget]

    results = results[
        results["longevity_hours"] >= min_longevity
    ]

    if occasion:
        results = results[
            results["occasion"].str.lower() == occasion.lower()
        ]

    if scent_family:
        results = results[
            results["scent_family"].str.lower()
            == scent_family.lower()
        ]

    return results.sort_values(
        by=["longevity_hours", "price_aed"],
        ascending=[False, True],
    )


def main():
    catalog = load_catalog()

    print("\n=== AI Fragrance Store ===")
    print(f"Loaded {len(catalog)} fragrances.")

    try:
        budget = float(input("Your maximum budget (AED): "))
        min_longevity = float(
            input("Minimum longevity in hours (0 for any): ")
        )
    except ValueError:
        print("Please enter valid numbers.")
        return

    occasion = input(
        "Occasion (Daily, Office, Casual, Evening, or Enter to skip): "
    ).strip()

    scent_family = input(
        "Scent family (e.g. Woody, Citrus, Floral, or Enter to skip): "
    ).strip()

    results = recommend_fragrances(
        catalog=catalog,
        budget=budget,
        occasion=occasion or None,
        scent_family=scent_family or None,
        min_longevity=min_longevity,
    )

    if results.empty:
        print("\nNo fragrances matched all your preferences.")
        return

    print("\n=== Your Recommendations ===")

    for _, perfume in results.iterrows():
        print(f"\n{perfume['name']} — {perfume['brand']}")
        print(f"  Scent: {perfume['scent_family']}")
        print(f"  Notes: {perfume['notes']}")
        print(f"  Occasion: {perfume['occasion']}")
        print(f"  Longevity: {perfume['longevity_hours']} hours")
        print(f"  Price: AED {perfume['price_aed']}")
        print(f"  {perfume['description']}")


if __name__ == "__main__":
    main()
