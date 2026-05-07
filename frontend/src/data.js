export const algorithms = {
  BFS: {
    name: 'Breadth-first search',
    short: 'BFS',
    color: '#2563eb',
    description: 'Best suited to shallow, uniform graphs where the shortest unweighted path matters.',
  },
  DFS: {
    name: 'Depth-first search',
    short: 'DFS',
    color: '#ea580c',
    description: 'Useful when memory is tight or the solution may be deep in a sparse state space.',
  },
  ASTAR: {
    name: 'A* search',
    short: 'A*',
    color: '#16a34a',
    description: 'Strong when a reliable heuristic can guide the search toward lower-cost paths.',
  },
  HILL: {
    name: 'Hill climbing',
    short: 'Hill',
    color: '#9333ea',
    description: 'Works well for heuristic optimization where a locally improving move is enough.',
  },
};

export const fallbackStats = {
  total_samples: 3000,
  class_distribution: {
    BFS: 760,
    DFS: 735,
    ASTAR: 772,
    HILL: 733,
  },
  model_accuracy: 0.94,
  feature_importances: {
    num_nodes: 0.12,
    num_edges: 0.16,
    branching_factor: 0.19,
    solution_depth: 0.18,
    heuristic_available: 0.21,
    density: 0.14,
  },
  total_predictions: 0,
};

export const fallbackDataset = {
  page: 1,
  limit: 8,
  total: 8,
  items: [
    { id: 1, num_nodes: 50, num_edges: 277, branching_factor: 11.08, solution_depth: 1, heuristic_available: 1, density: 0.2261, best_algorithm: 'HILL' },
    { id: 2, num_nodes: 18, num_edges: 43, branching_factor: 4.778, solution_depth: 9, heuristic_available: 0, density: 0.281, best_algorithm: 'DFS' },
    { id: 3, num_nodes: 12, num_edges: 12, branching_factor: 2, solution_depth: 2, heuristic_available: 0, density: 0.1818, best_algorithm: 'BFS' },
    { id: 4, num_nodes: 48, num_edges: 101, branching_factor: 4.208, solution_depth: 9, heuristic_available: 0, density: 0.0895, best_algorithm: 'DFS' },
    { id: 5, num_nodes: 44, num_edges: 472, branching_factor: 21.455, solution_depth: 4, heuristic_available: 1, density: 0.4989, best_algorithm: 'HILL' },
    { id: 6, num_nodes: 78, num_edges: 612, branching_factor: 15.69, solution_depth: 6, heuristic_available: 1, density: 0.2037, best_algorithm: 'ASTAR' },
    { id: 7, num_nodes: 31, num_edges: 30, branching_factor: 1.94, solution_depth: 3, heuristic_available: 0, density: 0.0645, best_algorithm: 'BFS' },
    { id: 8, num_nodes: 91, num_edges: 318, branching_factor: 6.99, solution_depth: 11, heuristic_available: 1, density: 0.0776, best_algorithm: 'ASTAR' },
  ],
};

export const fallbackPredictions = [
  { id: 1, predicted_algorithm: 'ASTAR', confidence: 0.91, num_nodes: 78, num_edges: 612, branching_factor: 15.69, solution_depth: 6, heuristic_available: 1, density: 0.2037, timestamp: new Date().toISOString() },
  { id: 2, predicted_algorithm: 'DFS', confidence: 0.86, num_nodes: 18, num_edges: 43, branching_factor: 4.778, solution_depth: 9, heuristic_available: 0, density: 0.281, timestamp: new Date(Date.now() - 86400000).toISOString() },
];
