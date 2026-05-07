import os
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./search_optimizer.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    num_nodes = Column(Integer, nullable=False)
    num_edges = Column(Integer, nullable=False)
    branching_factor = Column(Float, nullable=False)
    solution_depth = Column(Integer, nullable=False)
    heuristic_available = Column(Integer, nullable=False)
    density = Column(Float, nullable=False)
    best_algorithm = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    num_nodes = Column(Integer, nullable=False)
    num_edges = Column(Integer, nullable=False)
    branching_factor = Column(Float, nullable=False)
    solution_depth = Column(Integer, nullable=False)
    heuristic_available = Column(Integer, nullable=False)
    density = Column(Float, nullable=False)
    predicted_algorithm = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
