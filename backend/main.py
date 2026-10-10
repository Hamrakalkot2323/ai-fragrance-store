
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

from backend.semantic_recommender import (
    MODEL_NAME,
    load_catalog,
    recommend_semantically,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the catalogue and AI model once when the server starts.
    app.state.catalog = load_catalog()
    app.state.model = SentenceTransformer(MODEL_NAME)
    yield


app = FastAPI(
    title="AI Fragrance Store API",
    description="An API for AI-powered fragrance recommendations.",
    version="1.0.0",
    lifespan=lifespan,
)


class RecommendationRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=500,
        description="Describe the fragrance you want.",
    )


@app.get("/")
def home():
    return {
        "message": "Welcome to the AI Fragrance Store API!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/recommend")
def recommend(request: RecommendationRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=422,
            detail="Please describe the fragrance you want.",
        )

    results = recommend_semantically(
        message,
        app.state.catalog,
        app.state.model,
    )

    return {
        "query": message,
        "count": len(results),
        "recommendations": [
            {
                "id": int(row["id"]),
                "name": row["name"],
                "brand": row["brand"],
                "price_aed": float(row["price_aed"]),
                "scent_family": row["scent_family"],
                "notes": row["notes"],
                "occasion": row["occasion"],
                "longevity_hours": int(row["longevity_hours"]),
                "similarity_score": round(
                    float(row["similarity_score"]), 4
                ),
                "description": row["description"],
            }
            for _, row in results.iterrows()
        ],
    }

