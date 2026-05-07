import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  GitBranch,
  History,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Search,
  Server,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  clearPredictions,
  createPrediction,
  getDataset,
  getHealth,
  getPredictions,
  getStats,
} from './api';
import { algorithms, fallbackDataset, fallbackPredictions, fallbackStats } from './data';

const initialForm = {
  num_nodes: 50,
  num_edges: 120,
  branching_factor: 4.8,
  solution_depth: 7,
  heuristic_available: 1,
  density: 0.12,
};

const fieldConfig = [
  { name: 'num_nodes', label: 'Nodes', min: 1, max: 500, step: 1 },
  { name: 'num_edges', label: 'Edges', min: 0, max: 3000, step: 1 },
  { name: 'branching_factor', label: 'Branching factor', min: 0, max: 50, step: 0.1 },
  { name: 'solution_depth', label: 'Solution depth', min: 1, max: 40, step: 1 },
  { name: 'density', label: 'Density', min: 0, max: 1, step: 0.01 },
];

function formatAlgorithm(value) {
  return algorithms[value]?.short || value;
}

function percent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function normalisePayload(form) {
  return {
    num_nodes: Number(form.num_nodes),
    num_edges: Number(form.num_edges),
    branching_factor: Number(form.branching_factor),
    solution_depth: Number(form.solution_depth),
    heuristic_available: Number(form.heuristic_available),
    density: Number(form.density),
  };
}

function StatusPill({ online, trained }) {
  return (
    <div className={`status-pill ${online ? 'is-online' : 'is-offline'}`}>
      <Server size={15} />
      <span>{online ? `API online${trained ? ', model ready' : ''}` : 'Demo mode'}</span>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <section className="stat-tile">
      <div className={`tile-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function Predictor({ form, setForm, prediction, loading, onSubmit, error }) {
  const selected = prediction?.predicted_algorithm;
  const probabilityData = useMemo(() => {
    const source = prediction?.probabilities || {};
    return Object.keys(algorithms).map((key) => ({
      algorithm: algorithms[key].short,
      value: source[key] || 0,
      color: algorithms[key].color,
    }));
  }, [prediction]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <section className="panel predictor-panel" id="predictor">
      <div className="section-heading">
        <div>
          <h2>Predict the best search strategy</h2>
          <p>Tune graph features and let the trained classifier choose the most suitable algorithm.</p>
        </div>
        <BrainCircuit size={24} />
      </div>

      <form className="predictor-grid" onSubmit={onSubmit}>
        <div className="control-stack">
          {fieldConfig.map((field) => (
            <label className="range-control" key={field.name}>
              <span>
                <span>{field.label}</span>
                <output>{form[field.name]}</output>
              </span>
              <input
                name={field.name}
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={form[field.name]}
                onChange={handleChange}
              />
            </label>
          ))}

          <label className="toggle-row">
            <span>
              <strong>Heuristic available</strong>
              <small>A* and hill climbing become more competitive when this is enabled.</small>
            </span>
            <input
              name="heuristic_available"
              type="checkbox"
              checked={Number(form.heuristic_available) === 1}
              onChange={(event) => {
                setForm((current) => ({ ...current, heuristic_available: event.target.checked ? 1 : 0 }));
              }}
            />
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              <span>{loading ? 'Predicting' : 'Run prediction'}</span>
            </button>
            <button className="ghost-button" type="button" onClick={() => setForm(initialForm)}>
              <RotateCcw size={18} />
              <span>Reset</span>
            </button>
          </div>
          {error ? <p className="inline-error">{error}</p> : null}
        </div>

        <div className="result-card">
          <div className="result-orbit" aria-hidden="true">
            <GitBranch size={54} />
          </div>
          <span className="result-label">Recommended algorithm</span>
          <strong style={{ color: selected ? algorithms[selected]?.color : undefined }}>
            {selected ? algorithms[selected]?.name : 'Awaiting graph input'}
          </strong>
          <p>{selected ? algorithms[selected]?.description : 'Submit the feature set to generate a ranked probability profile.'}</p>
          <div className="confidence-row">
            <span>Confidence</span>
            <strong>{prediction ? percent(prediction.confidence) : '0%'}</strong>
          </div>
          <div className="mini-chart">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={probabilityData} margin={{ top: 12, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="algorithm" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(value) => percent(value)} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
                <Bar dataKey="value" radius={[7, 7, 0, 0]}>
                  {probabilityData.map((entry) => <Cell key={entry.algorithm} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </form>
    </section>
  );
}

function DistributionPanel({ stats }) {
  const distributionData = Object.keys(algorithms).map((key) => ({
    algorithm: algorithms[key].short,
    count: stats.class_distribution?.[key] || 0,
    color: algorithms[key].color,
  }));

  const importanceData = Object.entries(stats.feature_importances || {}).map(([feature, value]) => ({
    feature: feature.replaceAll('_', ' '),
    importance: value,
  }));

  return (
    <section className="insights-grid">
      <div className="panel chart-panel">
        <div className="section-heading compact">
          <div>
            <h2>Training distribution</h2>
            <p>Dataset balance across the four algorithm classes.</p>
          </div>
          <BarChart3 size={22} />
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={distributionData} margin={{ top: 18, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="algorithm" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {distributionData.map((entry) => <Cell key={entry.algorithm} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-panel">
        <div className="section-heading compact">
          <div>
            <h2>Feature influence</h2>
            <p>Random forest importances from the latest training pass.</p>
          </div>
          <SlidersHorizontal size={22} />
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={importanceData} margin={{ top: 18, right: 14, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="feature" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => percent(value)} />
            <Line type="monotone" dataKey="importance" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function DatasetTable({ dataset, page, setPage, loading }) {
  const totalPages = Math.max(1, Math.ceil((dataset.total || 0) / (dataset.limit || 12)));

  return (
    <section className="panel table-panel" id="dataset">
      <div className="section-heading compact">
        <div>
          <h2>Dataset explorer</h2>
          <p>Review representative graph cases used to train the classifier.</p>
        </div>
        <Database size={22} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>Nodes</th>
              <th>Edges</th>
              <th>Branching</th>
              <th>Depth</th>
              <th>Heuristic</th>
              <th>Density</th>
            </tr>
          </thead>
          <tbody>
            {dataset.items.map((row) => (
              <tr key={row.id}>
                <td><span className="algo-chip" style={{ '--chip': algorithms[row.best_algorithm]?.color }}>{formatAlgorithm(row.best_algorithm)}</span></td>
                <td>{row.num_nodes}</td>
                <td>{row.num_edges}</td>
                <td>{row.branching_factor}</td>
                <td>{row.solution_depth}</td>
                <td>{row.heuristic_available ? 'Yes' : 'No'}</td>
                <td>{row.density}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination-row">
        <button className="ghost-button" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button className="ghost-button" type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}

function PredictionHistory({ predictions, onClear, online }) {
  return (
    <section className="panel history-panel" id="history">
      <div className="section-heading compact">
        <div>
          <h2>Prediction history</h2>
          <p>Recent runs are stored by the API when the backend is online.</p>
        </div>
        <History size={22} />
      </div>
      <div className="history-list">
        {predictions.length === 0 ? (
          <div className="empty-state">
            <Search size={28} />
            <span>No predictions yet</span>
          </div>
        ) : predictions.map((item) => (
          <article className="history-item" key={item.id || item.timestamp}>
            <span className="algo-chip" style={{ '--chip': algorithms[item.predicted_algorithm]?.color }}>
              {formatAlgorithm(item.predicted_algorithm)}
            </span>
            <div>
              <strong>{percent(item.confidence)} confidence</strong>
              <small>{item.num_nodes} nodes, {item.num_edges} edges, depth {item.solution_depth}</small>
            </div>
          </article>
        ))}
      </div>
      <button className="ghost-button clear-button" type="button" onClick={onClear} disabled={!online || predictions.length === 0}>
        <Trash2 size={17} />
        <span>Clear history</span>
      </button>
    </section>
  );
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [stats, setStats] = useState(fallbackStats);
  const [dataset, setDataset] = useState(fallbackDataset);
  const [predictions, setPredictions] = useState(fallbackPredictions);
  const [prediction, setPrediction] = useState(null);
  const [online, setOnline] = useState(false);
  const [trained, setTrained] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [error, setError] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const [health, statsResponse, datasetResponse, predictionResponse] = await Promise.all([
        getHealth(),
        getStats(),
        getDataset(page, 12),
        getPredictions(8),
      ]);
      setOnline(true);
      setTrained(Boolean(health.model_trained));
      setStats(statsResponse);
      setDataset(datasetResponse);
      setPredictions(predictionResponse.items || []);
      setError('');
    } catch {
      setOnline(false);
      setTrained(false);
      setStats(fallbackStats);
      setDataset({ ...fallbackDataset, page });
      setPredictions(fallbackPredictions);
    }
  }, [page]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const statTiles = useMemo(() => [
    { icon: Database, label: 'Training samples', value: stats.total_samples.toLocaleString(), tone: 'blue' },
    { icon: CheckCircle2, label: 'Model accuracy', value: percent(stats.model_accuracy), tone: 'green' },
    { icon: Activity, label: 'Saved predictions', value: stats.total_predictions.toLocaleString(), tone: 'purple' },
  ], [stats]);

  async function handlePredict(event) {
    event.preventDefault();
    setLoadingPrediction(true);
    setError('');
    const payload = normalisePayload(form);

    try {
      const result = await createPrediction(payload);
      setPrediction(result);
      await refreshData();
    } catch {
      const demoAlgorithm = payload.heuristic_available ? (payload.solution_depth > 5 ? 'ASTAR' : 'HILL') : (payload.solution_depth > 6 ? 'DFS' : 'BFS');
      const demoResult = {
        predicted_algorithm: demoAlgorithm,
        confidence: 0.82,
        probabilities: {
          BFS: demoAlgorithm === 'BFS' ? 0.82 : 0.08,
          DFS: demoAlgorithm === 'DFS' ? 0.82 : 0.12,
          ASTAR: demoAlgorithm === 'ASTAR' ? 0.82 : 0.16,
          HILL: demoAlgorithm === 'HILL' ? 0.82 : 0.1,
        },
      };
      setPrediction(demoResult);
      setError('Backend is offline, so this is a deterministic demo estimate. Start FastAPI for live ML predictions.');
    } finally {
      setLoadingPrediction(false);
    }
  }

  async function handleClear() {
    try {
      await clearPredictions();
      setPredictions([]);
      await refreshData();
    } catch {
      setError('History can only be cleared when the backend is online.');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#predictor" aria-label="Search Algorithm Optimizer home">
          <span><BrainCircuit size={22} /></span>
          <strong>Search Algorithm Optimizer</strong>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#predictor">Predict</a>
          <a href="#dataset">Dataset</a>
          <a href="#history">History</a>
        </nav>
        <div className="topbar-actions">
          <StatusPill online={online} trained={trained} />
          <button className="icon-button" type="button" onClick={refreshData} aria-label="Refresh data">
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <h1>Choose the right search algorithm for a graph problem.</h1>
            <p>
              Compare BFS, DFS, A* search, and hill climbing using graph topology,
              heuristic availability, and learned behavior from the project dataset.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#predictor">
                <Sparkles size={18} />
                <span>Start optimizing</span>
              </a>
              <a className="ghost-button" href="#dataset">
                <Database size={18} />
                <span>Explore data</span>
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Algorithm comparison overview">
            {Object.entries(algorithms).map(([key, item], index) => (
              <div className="algo-node" key={key} style={{ '--node-color': item.color, '--delay': `${index * 80}ms` }}>
                <span>{item.short}</span>
                <small>{item.name}</small>
              </div>
            ))}
            <div className="graph-lines" aria-hidden="true" />
          </div>
        </section>

        <section className="stats-row" aria-label="Project summary">
          {statTiles.map((tile) => <StatTile key={tile.label} {...tile} />)}
        </section>

        <Predictor
          form={form}
          setForm={setForm}
          prediction={prediction}
          loading={loadingPrediction}
          onSubmit={handlePredict}
          error={error}
        />

        <DistributionPanel stats={stats} />

        <section className="lower-grid">
          <DatasetTable dataset={dataset} page={page} setPage={setPage} loading={!online} />
          <PredictionHistory predictions={predictions} onClear={handleClear} online={online} />
        </section>
      </main>
    </div>
  );
}
