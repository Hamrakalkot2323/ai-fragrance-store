
import re


def extract_preferences(message):
    """Extract basic fragrance preferences from a customer message."""

    text = message.lower()

    preferences = {
        "budget": None,
        "occasion": None,
        "scent_family": None,
        "min_longevity": 0,
    }

    # Extract a budget such as "under AED 300"
    budget_match = re.search(
        r"(?:under|below|within|budget of|maximum of)?\s*"
        r"(?:aed|dh)?\s*(\d+(?:\.\d+)?)\s*(?:aed|dh)?",
        text,
    )

    if budget_match:
        preferences["budget"] = float(budget_match.group(1))

    # Identify an occasion
    occasion_keywords = {
        "Evening": ["evening", "dinner", "date night", "party"],
        "Office": ["office", "work", "professional"],
        "Daily": ["daily", "everyday", "daytime"],
        "Casual": ["casual", "weekend"],
    }

    for occasion, keywords in occasion_keywords.items():
        if any(word in text for word in keywords):
            preferences["occasion"] = occasion
            break

    # Identify a scent family
    scent_keywords = {
        "Woody": ["woody", "wood", "cedarwood", "sandalwood"],
        "Citrus": ["citrus", "lemon", "bergamot", "orange"],
        "Floral": ["floral", "rose", "jasmine", "flower"],
        "Aquatic": ["aquatic", "ocean", "fresh sea"],
        "Musky": ["musk", "musky"],
        "Gourmand": ["gourmand", "vanilla", "caramel", "sweet"],
        "Spicy": ["spicy", "cinnamon", "cardamom"],
    }

    for family, keywords in scent_keywords.items():
        if any(word in text for word in keywords):
            preferences["scent_family"] = family
            break

    # Look for explicit longevity requirements
    longevity_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr)",
        text,
    )

    if longevity_match:
        preferences["min_longevity"] = float(
            longevity_match.group(1)
        )
    elif any(word in text for word in ["all day", "all night", "long-lasting"]):
        preferences["min_longevity"] = 8

    return preferences


if __name__ == "__main__":
    customer_message = input("Describe your ideal fragrance: ")
    preferences = extract_preferences(customer_message)

    print("\nExtracted preferences:")
    for key, value in preferences.items():
        print(f"{key}: {value}")
