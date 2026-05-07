import os
from typing import Literal

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import Prediction, Problem, SessionLocal, create_tables, get_db
from ml_model import ALGORITHMS, FEATURE_COLUMNS, search_model


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "dataset.csv")

app = FastAPI(title="Search Algorithm Optimizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-netlify-app.netlify.app",
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    num_nodes: int = Field(..., ge=1)
    num_edges: int = Field(..., ge=0)
    branching_factor: float = Field(..., ge=0)
    solution_depth: int = Field(..., ge=1)
    heuristic_available: int = Field(..., ge=0, le=1)
    density: float = Field(..., ge=0)


def problem_to_dict(problem: Problem):
    return {
        "id": problem.id,
        "num_nodes": problem.num_nodes,
        "num_edges": problem.num_edges,
        "branching_factor": round(problem.branching_factor, 3),
        "solution_depth": problem.solution_depth,
        "heuristic_available": problem.heuristic_available,
        "density": round(problem.density, 4),
        "best_algorithm": problem.best_algorithm,
        "created_at": problem.created_at.isoformat() if problem.created_at else None,
    }


def prediction_to_dict(prediction: Prediction):
    return {
        "id": prediction.id,
        "num_nodes": prediction.num_nodes,
        "num_edges": prediction.num_edges,
        "branching_factor": round(prediction.branching_factor, 3),
        "solution_depth": prediction.solution_depth,
        "heuristic_available": prediction.heuristic_available,
        "density": round(prediction.density, 4),
        "predicted_algorithm": prediction.predicted_algorithm,
        "confidence": prediction.confidence,
        "timestamp": prediction.timestamp.isoformat() if prediction.timestamp else None,
    }


def load_dataset() -> pd.DataFrame:
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Dataset not found at {CSV_PATH}")

    data = pd.read_csv(CSV_PATH)
    missing_columns = set(FEATURE_COLUMNS + ["best_algorithm"]) - set(data.columns)
    if missing_columns:
        raise ValueError(f"dataset.csv is missing columns: {', '.join(sorted(missing_columns))}")

    data["best_algorithm"] = data["best_algorithm"].str.upper().replace({"A*": "ASTAR"})
    return data


def seed_database(db: Session, data: pd.DataFrame):
    existing_count = db.query(Problem).count()
    if existing_count > 0:
        return

    rows = [
        Problem(
            num_nodes=int(row.num_nodes),
            num_edges=int(row.num_edges),
            branching_factor=float(row.branching_factor),
            solution_depth=int(row.solution_depth),
            heuristic_available=int(row.heuristic_available),
            density=float(row.density),
            best_algorithm=str(row.best_algorithm),
        )
        for row in data.itertuples(index=False)
    ]
    db.bulk_save_objects(rows)
    db.commit()


@app.on_event("startup")
def startup():
    create_tables()
    data = load_dataset()
    with SessionLocal() as db:
        seed_database(db, data)
    search_model.train(data)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "model_trained": search_model.is_trained}


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    db_distribution = dict(
        db.query(Problem.best_algorithm, func.count(Problem.id))
        .group_by(Problem.best_algorithm)
        .all()
    )

    return {
        "total_samples": db.query(Problem).count(),
        "class_distribution": {
            algorithm: int(db_distribution.get(algorithm, 0))
            for algorithm in ALGORITHMS
        },
        "model_accuracy": search_model.metrics.accuracy,
        "feature_importances": search_model.metrics.feature_importances,
        "total_predictions": db.query(Prediction).count(),
    }


@app.post("/api/predict")
def predict(payload: PredictionRequest, db: Session = Depends(get_db)):
    if not search_model.is_trained:
        raise HTTPException(status_code=503, detail="Model is still training. Try again shortly.")

    result = search_model.predict(payload.dict())
    prediction = Prediction(
        **payload.dict(),
        predicted_algorithm=result["predicted_algorithm"],
        confidence=result["confidence"],
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return result


@app.get("/api/predictions")
def get_predictions(limit: int = Query(20, ge=1, le=500), db: Session = Depends(get_db)):
    predictions = (
        db.query(Prediction)
        .order_by(Prediction.timestamp.desc())
        .limit(limit)
        .all()
    )
    return {"items": [prediction_to_dict(prediction) for prediction in predictions]}


@app.delete("/api/predictions")
def clear_predictions(db: Session = Depends(get_db)):
    deleted = db.query(Prediction).delete()
    db.commit()
    return {"deleted": deleted}


@app.get("/api/dataset")
def get_dataset(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Problem).order_by(Problem.id.asc())
    total = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "items": [problem_to_dict(problem) for problem in rows],
    }


@app.get("/api/dataset/filter")
def filter_dataset(
    algorithm: Literal["BFS", "DFS", "ASTAR", "HILL"] = Query(...),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Problem)
        .filter(Problem.best_algorithm == algorithm)
        .order_by(Problem.id.asc())
        .all()
    )
    return {
        "algorithm": algorithm,
        "total": len(rows),
        "items": [problem_to_dict(problem) for problem in rows],
    }
