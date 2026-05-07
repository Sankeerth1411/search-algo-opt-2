# Search Algorithm Optimizer

Full-stack AI/ML mini project that predicts the best classical search algorithm for a graph problem: BFS, DFS, A* Search, or Hill Climbing.

The backend trains a `RandomForestClassifier` on `backend/dataset.csv` with 3000 generated graph instances. The frontend is a React + Vite + Tailwind dashboard with prediction, dataset exploration, charts, and prediction history.

## Project Structure

```text
backend/
  main.py
  database.py
  ml_model.py
  dataset.csv
  requirements.txt
  Procfile
  runtime.txt
frontend/
  src/
  netlify.toml
  package.json
  vite.config.js
run.sh
```

## Local Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs are available at `http://localhost:8000/docs`.

## Local Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:8000` in development.

You can also start both servers with:

```bash
bash run.sh
```

## API

- `GET /api/stats`
- `POST /api/predict`
- `GET /api/predictions?limit=20`
- `DELETE /api/predictions`
- `GET /api/dataset?page=1&limit=50`
- `GET /api/dataset/filter?algorithm=BFS`

## Backend Deployment: Render

1. Push code to GitHub.
2. Go to Render -> New Web Service.
3. Connect your GitHub repo.
4. Root directory: `backend`.
5. Build command: `pip install -r requirements.txt`.
6. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
7. Copy the deployed URL, for example `https://search-optimizer.onrender.com`.

`backend/runtime.txt` pins Render to Python 3.11.9, which is compatible with the exact scikit-learn and NumPy versions required for this project.

Render free tier can spin down after inactivity. The frontend shows a cold-start loading message when the first API call takes longer than expected.

For persistent SQLite storage on Render, attach a persistent disk and set `DATABASE_URL` to a SQLite path on that disk. For production-grade persistence, replace SQLite with PostgreSQL using Render's database connection string and add the required PostgreSQL driver.

## Frontend Deployment: Netlify

1. Go to Netlify -> Add new site -> Import from Git.
2. Root directory: `frontend`.
3. Build command: `npm run build`.
4. Publish directory: `dist`.
5. Environment variables -> Add `VITE_API_URL=<your Render backend URL>`.
6. Deploy site.

`frontend/netlify.toml` includes the SPA redirect needed for React Router.
