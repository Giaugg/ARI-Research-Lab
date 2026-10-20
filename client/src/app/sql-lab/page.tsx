'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Zap, 
  Database, 
  BarChart3, 
  Play, 
  Flame, 
  Gauge, 
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SqlLabPage() {
  const [activeTab, setActiveTab] = useState<'explain' | 'indexBenchmark' | 'pagination' | 'search' | 'datasetScaler'>('explain');

  // Explain State
  const [selectedQueryType, setSelectedQueryType] = useState('reachability');
  const [explainResult, setExplainResult] = useState<any | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  // Index Benchmark State
  const [indexBenchmarkTarget, setIndexBenchmarkTarget] = useState('network');
  const [indexResult, setIndexResult] = useState<any | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);

  // Pagination Benchmark State
  const [paginationResult, setPaginationResult] = useState<any | null>(null);
  const [paginationLoading, setPaginationLoading] = useState(false);

  // Search Benchmark State
  const [searchTerm, setSearchTerm] = useState('recursive');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Scaler State
  const [scalingCount, setScalingCount] = useState(100);
  const [scalingStatus, setScalingStatus] = useState<any | null>(null);
  const [scalingLoading, setScalingLoading] = useState(false);

  // Run Explain
  const handleRunExplain = async () => {
    setExplainLoading(true);
    try {
      const res = await api.runExplain(selectedQueryType, { userId: 1, maxDepth: 3, postId: 1 });
      setExplainResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setExplainLoading(false);
    }
  };

  // Run Index Benchmark
  const handleRunIndexBenchmark = async () => {
    setIndexLoading(true);
    try {
      const res = await api.benchmarkIndexes(indexBenchmarkTarget);
      setIndexResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIndexLoading(false);
    }
  };

  // Run Pagination Benchmark
  const handleRunPaginationBenchmark = async () => {
    setPaginationLoading(true);
    try {
      const res = await api.benchmarkPagination();
      setPaginationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setPaginationLoading(false);
    }
  };

  // Run Search Benchmark
  const handleRunSearchBenchmark = async () => {
    setSearchLoading(true);
    try {
      const res = await api.benchmarkSearch(searchTerm);
      setSearchResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  // Scale Database
  const handleScaleData = async () => {
    setScalingLoading(true);
    try {
      const res = await api.scaleData(scalingCount);
      setScalingStatus(res);
    } catch (e) {
      console.error(e);
    } finally {
      setScalingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              PostgreSQL 18 Execution Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            SQL Optimization & Performance Research Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Empirical benchmarking with <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded border border-blue-100">EXPLAIN (ANALYZE, BUFFERS)</code>, B-tree indexes, Keyset Seek, and GIN vectors.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
          <button
            onClick={() => setActiveTab('explain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'explain'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>EXPLAIN Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('indexBenchmark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'indexBenchmark'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Index Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('pagination')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pagination'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Keyset vs Offset</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>GIN FTS vs ILIKE</span>
          </button>

          <button
            onClick={() => setActiveTab('datasetScaler')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'datasetScaler'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Data Scaler</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EXPLAIN ANALYZE PLAN VIEWER */}
      {activeTab === 'explain' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-600" />
                  <span>Interactive EXPLAIN (ANALYZE, BUFFERS) Runner</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect query execution plan trees, buffer cache hits, and node execution times directly from PostgreSQL.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedQueryType}
                  onChange={(e) => setSelectedQueryType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="reachability">Problem 1: N-Hop Reachability CTE</option>
                  <option value="shortest_path">Problem 2: Shortest Path Finder</option>
                  <option value="comment_tree">Problem 3: Threaded Comments Tree</option>
                  <option value="recommendation">Problem 4: Collaborative Recommendation</option>
                  <option value="cycle_detection">Problem 5: Cycle Detection</option>
                </select>

                <button
                  onClick={handleRunExplain}
                  disabled={explainLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${explainLoading ? 'animate-spin' : ''}`} />
                  <span>Execute EXPLAIN</span>
                </button>
              </div>
            </div>

            {/* Explain Results Display */}
            {explainResult && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Execution Time</p>
                    <p className="text-lg font-bold text-blue-600 font-mono mt-1">
                      {explainResult.executionTimeMs} ms
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Planning Time</p>
                    <p className="text-lg font-bold text-slate-800 font-mono mt-1">
                      {explainResult.planningTimeMs} ms
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Root Node Type</p>
                    <p className="text-sm font-bold text-emerald-700 font-mono mt-1 truncate">
                      {explainResult.planTree?.['Node Type'] || 'Recursive Union'}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Shared Hit Blocks</p>
                    <p className="text-lg font-bold text-indigo-600 font-mono mt-1">
                      {explainResult.planTree?.['Shared Hit Blocks'] || 0} blocks
                    </p>
                  </div>
                </div>

                {/* Raw SQL */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-100 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 mb-2">Executed Parameterized Query:</div>
                  <pre className="text-slate-200 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {explainResult.rawSql}
                  </pre>
                </div>

                {/* Raw Plan Output */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-100 shadow-sm">
                  <div className="text-[11px] font-bold text-cyan-400 mb-2">PostgreSQL Planner & Buffer Analysis:</div>
                  <pre className="text-emerald-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {explainResult.explainText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INDEX SCAN VS SEQUENTIAL SCAN BENCHMARK */}
      {activeTab === 'indexBenchmark' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Index Scan vs Sequential Scan Arena</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Comparing <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded border border-blue-100">idx_follows_follower</code> vs Forced Sequential Scan using PostgreSQL session toggles.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={indexBenchmarkTarget}
                  onChange={(e) => setIndexBenchmarkTarget(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="network">Follows Graph (Recursive CTE Traversal)</option>
                  <option value="comments">Comments Tree (parent_id recursion)</option>
                </select>

                <button
                  onClick={handleRunIndexBenchmark}
                  disabled={indexLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${indexLoading ? 'animate-spin' : ''}`} />
                  <span>Run Benchmark</span>
                </button>
              </div>
            </div>

            {indexResult && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                {/* Speedup Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider font-mono">Speedup Factor</span>
                    <h3 className="text-2xl font-black text-emerald-950 mt-0.5">
                      {indexResult.speedupFactor}x Faster with Index
                    </h3>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                {/* Head to Head Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* With Index */}
                  <div className="bg-slate-50 border border-emerald-300 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase font-mono">WITH INDEX SCAN</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Optimized</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 font-mono">
                      {indexResult.withIndex.executionTimeMs} ms
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200 font-mono">
                      <p>Node Type: <strong className="text-slate-800">{indexResult.withIndex.nodeType}</strong></p>
                      <p>Planning: <strong className="text-slate-800">{indexResult.withIndex.planningTimeMs} ms</strong></p>
                      <p>Shared Hit Blocks: <strong className="text-slate-800">{indexResult.withIndex.sharedHitBlocks}</strong></p>
                    </div>
                  </div>

                  {/* Without Index */}
                  <div className="bg-slate-50 border border-amber-300 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase font-mono">WITHOUT INDEX (SEQ SCAN)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Sequential</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 font-mono">
                      {indexResult.withoutIndex.executionTimeMs} ms
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200 font-mono">
                      <p>Node Type: <strong className="text-slate-800">{indexResult.withoutIndex.nodeType}</strong></p>
                      <p>Planning: <strong className="text-slate-800">{indexResult.withoutIndex.planningTimeMs} ms</strong></p>
                      <p>Shared Hit Blocks: <strong className="text-slate-800">{indexResult.withoutIndex.sharedHitBlocks}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KEYSET VS OFFSET PAGINATION */}
      {activeTab === 'pagination' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  <span>Keyset (Seek Method) vs OFFSET/LIMIT Pagination</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Why <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded border border-blue-100">(created_at, post_id) &lt; ($last_time, $last_id)</code> outperforms <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded border border-blue-100">OFFSET N</code> on large scientific datasets.
                </p>
              </div>

              <button
                onClick={handleRunPaginationBenchmark}
                disabled={paginationLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Play className={`w-3.5 h-3.5 ${paginationLoading ? 'animate-spin' : ''}`} />
                <span>Run Pagination Test</span>
              </button>
            </div>

            {paginationResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 font-mono">OFFSET 50 (Deep Page)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-semibold">Scans & Skips</span>
                  </div>
                  <div className="text-3xl font-black text-amber-600 font-mono">
                    {paginationResult.offsetMethod.executionTimeMs} ms
                  </div>
                  <p className="text-xs text-slate-600">
                    PostgreSQL must scan through all 50 preceding records in memory before returning 10.
                  </p>
                </div>

                <div className="bg-slate-50 border border-blue-300 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 font-mono">KEYSET SEEK (created_at, post_id)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-semibold">B-tree Seek</span>
                  </div>
                  <div className="text-3xl font-black text-blue-700 font-mono">
                    {paginationResult.keysetMethod.executionTimeMs} ms
                  </div>
                  <p className="text-xs text-slate-600">
                    Jumps directly to index position in <code className="text-blue-700 font-mono">O(log N)</code> time without reading discarded entries.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GIN FULL TEXT SEARCH VS ILIKE */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span>PostgreSQL GIN Full-Text Search vs ILIKE</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Compare inverted index vector ranking (<code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded border border-blue-100">to_tsquery</code>) with substring scanning.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. recursive, database"
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <button
                  onClick={handleRunSearchBenchmark}
                  disabled={searchLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${searchLoading ? 'animate-spin' : ''}`} />
                  <span>Test Search</span>
                </button>
              </div>
            </div>

            {searchResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 border border-blue-300 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 font-mono">GIN INDEX FULL-TEXT SEARCH</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">Lexeme Inverted</span>
                  </div>
                  <div className="text-3xl font-black text-blue-700 font-mono">
                    {searchResult.fullTextSearch.executionTimeMs} ms
                  </div>
                  <div className="text-xs text-slate-600 font-mono space-y-1">
                    <p>Node: {searchResult.fullTextSearch.nodeType}</p>
                    <p>Planning: {searchResult.fullTextSearch.planningTimeMs} ms</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-amber-300 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 font-mono">TRADITIONAL ILIKE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Sequential Scan</span>
                  </div>
                  <div className="text-3xl font-black text-amber-600 font-mono">
                    {searchResult.regularILike.executionTimeMs} ms
                  </div>
                  <div className="text-xs text-slate-600 font-mono space-y-1">
                    <p>Node: {searchResult.regularILike.nodeType}</p>
                    <p>Planning: {searchResult.regularILike.planningTimeMs} ms</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DATASET SCALER */}
      {activeTab === 'datasetScaler' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Synthetic Graph Scaler for Empirical Measurements</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generate high-density synthetic academic researchers and follow connections to test recursive complexity curves as $N$ scales.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <select
                value={scalingCount}
                onChange={(e) => setScalingCount(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value={50}>Inject +50 Researchers & 300 Edges</option>
                <option value={100}>Inject +100 Researchers & 600 Edges</option>
                <option value={200}>Inject +200 Researchers & 1,200 Edges</option>
              </select>

              <button
                onClick={handleScaleData}
                disabled={scalingLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Flame className={`w-3.5 h-3.5 ${scalingLoading ? 'animate-spin' : ''}`} />
                <span>{scalingLoading ? 'Generating Graph Topology...' : 'Scale Dataset'}</span>
              </button>
            </div>

            {scalingStatus && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
                <p className="text-emerald-700 font-bold">{scalingStatus.message}</p>
                <div className="flex items-center gap-6 text-slate-600 pt-2 border-t border-slate-200">
                  <span>Total Network Nodes: <strong className="text-slate-900">{scalingStatus.currentStats.totalUsers}</strong></span>
                  <span>Total Directed Edges: <strong className="text-slate-900">{scalingStatus.currentStats.totalFollows}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
