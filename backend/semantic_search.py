
from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim


def main():
    # Load a small pretrained text-embedding model.
    print("Loading the embedding model...")

    model = SentenceTransformer("all-MiniLM-L6-v2")

    # Example customer request and product descriptions.
    customer_request = (
        "I want a warm, sweet perfume for a romantic dinner."
    )

    fragrance_descriptions = [
        (
            "Amber Nights",
            "A warm fragrance with vanilla, amber, "
            "and sandalwood for special occasions.",
        ),
        (
            "Ocean Drift",
            "A fresh aquatic fragrance with sea salt "
            "and bergamot for everyday use.",
        ),
        (
            "Sweet Cloud",
            "A sweet gourmand fragrance with vanilla "
            "and caramel.",
        ),
        (
            "Green Escape",
            "A woody fragrance with vetiver and green tea "
            "for the office.",
        ),
    ]

    # Convert the customer request into a numerical vector.
    query_embedding = model.encode(
        customer_request,
        convert_to_tensor=True,
    )

    # Convert every product description into a vector.
    descriptions = [
        description
        for _, description in fragrance_descriptions
    ]

    product_embeddings = model.encode(
        descriptions,
        convert_to_tensor=True,
    )

    # Calculate similarity between the request and each product.
    similarities = cos_sim(
        query_embedding,
        product_embeddings,
    )[0]

    # Sort products from most similar to least similar.
    ranked_indices = similarities.argsort(
        descending=True
    ).tolist()

    print("\nCustomer request:")
    print(customer_request)

    print("\n=== Semantic Search Results ===")

    for index in ranked_indices:
        name, description = fragrance_descriptions[index]
        score = similarities[index].item()

        print(f"\n{name}")
        print(f"Similarity score: {score:.4f}")
        print(f"Description: {description}")


if __name__ == "__main__":
    main()
