from dataclasses import dataclass

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split


FEATURE_COLUMNS = [
    "num_nodes",
    "num_edges",
    "branching_factor",
    "solution_depth",
    "heuristic_available",
    "density",
]
ALGORITHMS = ["BFS", "DFS", "ASTAR", "HILL"]


@dataclass
class ModelMetrics:
    accuracy: float
    feature_importances: dict
    class_distribution: dict


class SearchAlgorithmModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.metrics = ModelMetrics(
            accuracy=0.0,
            feature_importances={feature: 0.0 for feature in FEATURE_COLUMNS},
            class_distribution={algorithm: 0 for algorithm in ALGORITHMS},
        )
        self.is_trained = False

    def train(self, data: pd.DataFrame):
        cleaned = data.copy()
        cleaned["best_algorithm"] = cleaned["best_algorithm"].str.upper().replace({"A*": "ASTAR"})

        x = cleaned[FEATURE_COLUMNS]
        y = cleaned["best_algorithm"]

        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y,
        )

        self.model.fit(x_train, y_train)
        predictions = self.model.predict(x_test)
        accuracy = accuracy_score(y_test, predictions)

        importances = {
            feature: float(importance)
            for feature, importance in zip(FEATURE_COLUMNS, self.model.feature_importances_)
        }
        distribution = cleaned["best_algorithm"].value_counts().to_dict()

        self.metrics = ModelMetrics(
            accuracy=float(accuracy),
            feature_importances=importances,
            class_distribution={algorithm: int(distribution.get(algorithm, 0)) for algorithm in ALGORITHMS},
        )
        self.is_trained = True

    def predict(self, features: dict):
        if not self.is_trained:
            raise RuntimeError("Model has not been trained yet.")

        feature_frame = pd.DataFrame([[features[column] for column in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
        predicted_algorithm = self.model.predict(feature_frame)[0]
        probabilities_raw = self.model.predict_proba(feature_frame)[0]
        class_probabilities = dict(zip(self.model.classes_, probabilities_raw))
        probabilities = {
            algorithm: float(class_probabilities.get(algorithm, 0.0))
            for algorithm in ALGORITHMS
        }

        return {
            "predicted_algorithm": predicted_algorithm,
            "confidence": float(max(probabilities.values())),
            "probabilities": probabilities,
        }


search_model = SearchAlgorithmModel()
