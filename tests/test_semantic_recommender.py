
import pandas as pd

from backend.semantic_recommender import recommend_semantically


class FakeModel:
    """A lightweight stand-in for the AI model in filter tests."""

    def encode(self, texts, convert_to_tensor=True):
        import torch

        if isinstance(texts, str):
            texts = [texts]

        return torch.ones((len(texts), 3))


def test_budget_filter_excludes_expensive_perfumes():
    catalog = pd.DataFrame([
        {
            "name": "Affordable Fresh",
            "brand": "Test Brand",
            "price_aed": 150,
            "scent_family": "Citrus",
            "notes": "lemon, bergamot",
            "occasion": "Daily",
            "longevity_hours": 5,
            "description": "A fresh daily fragrance",
        },
        {
            "name": "Luxury Amber",
            "brand": "Test Brand",
            "price_aed": 280,
            "scent_family": "Oriental",
            "notes": "amber, vanilla",
            "occasion": "Daily",
            "longevity_hours": 10,
            "description": "A warm fragrance",
        },
    ])

    results = recommend_semantically(
        "Fresh perfume under AED 170",
        catalog,
        FakeModel(),
    )

    assert not results.empty
    assert (results["price_aed"] <= 170).all()
    assert "Luxury Amber" not in results["name"].tolist()

    
def test_occasion_filter_excludes_other_occasions():
    catalog = pd.DataFrame([
        {
            "name": "Daily Citrus",
            "brand": "Test Brand",
            "price_aed": 120,
            "scent_family": "Citrus",
            "notes": "lemon, bergamot",
            "occasion": "Daily",
            "longevity_hours": 5,
            "description": "A fresh everyday fragrance",
        },
        {
            "name": "Evening Amber",
            "brand": "Test Brand",
            "price_aed": 200,
            "scent_family": "Oriental",
            "notes": "amber, vanilla",
            "occasion": "Evening",
            "longevity_hours": 10,
            "description": "A warm evening fragrance",
        },
    ])

    results = recommend_semantically(
        "Perfume for daily use",
        catalog,
        FakeModel(),
    )

    assert not results.empty
    assert (results["occasion"].str.lower() == "daily").all()


def test_impossible_budget_returns_no_results():
    catalog = pd.DataFrame([
        {
            "name": "Affordable Fresh",
            "brand": "Test Brand",
            "price_aed": 120,
            "scent_family": "Citrus",
            "notes": "lemon, bergamot",
            "occasion": "Evening",
            "longevity_hours": 5,
            "description": "A fresh fragrance",
        },
    ])

    results = recommend_semantically(
        "Evening perfume under AED 50 lasting 12 hours",
        catalog,
        FakeModel(),
    )

    assert results.empty


def test_results_are_sorted_by_similarity():
    catalog = pd.DataFrame([
        {
            "name": "Fresh Citrus",
            "brand": "Test Brand",
            "price_aed": 120,
            "scent_family": "Citrus",
            "notes": "lemon, orange",
            "occasion": "Daily",
            "longevity_hours": 5,
            "description": "A bright citrus fragrance",
        },
        {
            "name": "Sweet Vanilla",
            "brand": "Test Brand",
            "price_aed": 150,
            "scent_family": "Gourmand",
            "notes": "vanilla, caramel",
            "occasion": "Daily",
            "longevity_hours": 7,
            "description": "A sweet gourmand fragrance",
        },
    ])

    results = recommend_semantically(
        "Sweet perfume for daily use",
        catalog,
        FakeModel(),
    )

    scores = results["similarity_score"].tolist()

    assert scores == sorted(scores, reverse=True)
