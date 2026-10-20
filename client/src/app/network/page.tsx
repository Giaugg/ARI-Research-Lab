'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Network as NetworkIcon, 
  Search, 
  Route, 
  RefreshCw, 
  RotateCw, 
  Users, 
  ArrowRight, 
  Layers, 
  Code2, 
  Clock,
  Sparkles,
  GitCommit
} from 'lucide-react';
import { api, User } from '@/lib/api';
import NetworkGraphCanvas from '@/components/NetworkGraphCanvas';

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<'reachability' | 'pathfinder' | 'cycles' | 'communities'>('reachability');
  
  // Graph Canvas Data
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [highlightPath, setHighlightPath] = useState<number[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(1);

  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Problem 1: Reachability State
  const [reachStartUser, setReachStartUser] = useState<number>(1);
  const [reachMaxDepth, setReachMaxDepth] = useState<number>(3);
  const [reachResults, setReachResults] = useState<any[]>([]);
  const [reachMeta, setReachMeta] = useState<{ executionMs: number; count: number } | null>(null);
  const [reachLoading, setReachLoading] = useState(false);

  // Problem 2: Path Finder State
  const [sourceId, setSourceId] = useState<number>(1);
  const [targetId, setTargetId] = useState<number>(3);
  const [foundPaths, setFoundPaths] = useState<any[]>([]);
  const [pathMeta, setPathMeta] = useState<{ executionMs: number; shortestDistance: number | null } | null>(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([]);

  // Problem 5: Cycles State
  const [cycleStartUser, setCycleStartUser] = useState<number>(1);
  const [cycles, setCycles] = useState<any[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);

  // Communities State
  const [communities, setCommunities] = useState<any[]>([]);

  // Load Initial Graph and User List
  const loadGraphAndUsers = async () => {
    try {
      const [gRes, uRes] = await Promise.all([
        api.getNetworkGraph(),
        api.getUsers()
      ]);
      if (gRes?.nodes) {
        setGraphData({
          nodes: gRes.nodes,
          edges: gRes.edges
        });
      }
      if (uRes?.users) setAllUsers(uRes.users);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGraphAndUsers();
  }, []);

  // Run Problem 1: Reachability
  const handleRunReachability = async () => {
    setReachLoading(true);
    try {
      const res = await api.getReachability(reachStartUser, reachMaxDepth);
      if (res?.results) {
        setReachResults(res.results);
        setReachMeta({ executionMs: res.executionMs, count: res.reachableNodesCount });
        setSelectedNodeId(reachStartUser);
        // Highlight nodes within reachability
        const reachableIds = res.results.map((r: any) => r.user_id);
        setHighlightPath([reachStartUser, ...reachableIds]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReachLoading(false);
    }
  };

  // Run Problem 2: Path Finder
  const handleRunPathFinder = async () => {
    if (sourceId === targetId) return;
    setPathLoading(true);
    try {
      const [pathRes, mutualRes] = await Promise.all([
        api.findPath(sourceId, targetId, 5),
        api.getMutualConnections(sourceId, targetId)
      ]);

      if (pathRes?.paths) {
        setFoundPaths(pathRes.paths);
        setPathMeta({
          executionMs: pathRes.executionMs,
          shortestDistance: pathRes.shortestDistance
        });

        if (pathRes.paths.length > 0) {
          // Highlight first shortest path on canvas!
          setHighlightPath(pathRes.paths[0].path);
        } else {
          setHighlightPath([]);
        }
      }

      if (mutualRes?.mutualFollowers) {
        setMutualFollowers(mutualRes.mutualFollowers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPathLoading(false);
    }
  };

  // Run Problem 5: Cycles
  const handleRunCycles = async () => {
    setCyclesLoading(true);
    try {
      const res = await api.detectCycles(cycleStartUser, 4);
      if (res?.cycles) {
        setCycles(res.cycles);
        if (res.cycles.length > 0) {
          setHighlightPath(res.cycles[0].path);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCyclesLoading(false);
    }
  };

  // Load Communities
  const handleLoadCommunities = async () => {
    try {
      const res = await api.getCommunities();
      if (res?.communities) setCommunities(res.communities);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'reachability') handleRunReachability();
    else if (activeTab === 'pathfinder') handleRunPathFinder();
    else if (activeTab === 'cycles') handleRunCycles();
    else if (activeTab === 'communities') handleLoadCommunities();
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Graph Traversal & Recursive Queries
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Academic Researcher Network Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyzing directed relationships, shortest connection paths, and cycles with PostgreSQL <code className="text-cyan-300 font-mono">WITH RECURSIVE</code>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('reachability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reachability'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>N-Hop Reachability</span>
          </button>

          <button
            onClick={() => setActiveTab('pathfinder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pathfinder'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Path Finder</span>
          </button>

          <button
            onClick={() => setActiveTab('cycles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cycles'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Cycle Detection</span>
          </button>

          <button
            onClick={() => setActiveTab('communities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'communities'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Communities</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas on Left, Controls & Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Visual Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <NetworkIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Interactive Directed Topology Canvas</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {graphData.nodes.length} nodes • {graphData.edges.length} edges
              </span>
            </div>

            <NetworkGraphCanvas
              nodes={graphData.nodes}
              edges={graphData.edges}
              highlightPath={highlightPath}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                if (activeTab === 'reachability') setReachStartUser(id);
                if (activeTab === 'pathfinder') setTargetId(id);
                if (activeTab === 'cycles') setCycleStartUser(id);
              }}
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-3 border-t border-slate-800 mt-2 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                  <span>Active Researcher</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                  <span>Traversed Path</span>
                </span>
              </div>
              <span>Click node to select as target</span>
            </div>
          </div>
        </div>

        {/* Right Column: Tab-Specific Query Parameters & Detailed Output */}
        <div className="lg:col-span-5 space-y-6">

          {/* TAB 1: N-Hop Reachability */}
          {activeTab === 'reachability' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Problem 1: N-Hop Follower Reachability</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Discover all researchers reachable within <code className="text-cyan-300 font-mono">depth &lt; N</code> hops while checking cycles via array path.
                </p>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Starting Researcher</label>
                  <select
                    value={reachStartUser}
                    onChange={(e) => setReachStartUser(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {allUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name} (ID: {u.user_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Max Depth: <span className="text-cyan-400 font-mono font-bold">{reachMaxDepth} hops</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reachMaxDepth}
                    onChange={(e) => setReachMaxDepth(parseInt(e.target.value, 10))}
                    className="w-full mt-2 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleRunReachability}
                disabled={reachLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reachLoading ? 'animate-spin' : ''}`} />
                <span>Execute Recursive Traversal</span>
              </button>

              {/* Execution Meta */}
              {reachMeta && (
                <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                  <span>Reachable: <strong className="text-cyan-400">{reachMeta.count} scholars</strong></span>
                  <span>Duration: <strong className="text-cyan-400">{reachMeta.executionMs} ms</strong></span>
                </div>
              )}

              {/* Results List */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {reachResults.map((item) => (
                  <div
                    key={item.user_id}
                    onClick={() => {
                      if (item.sample_paths && item.sample_paths.length > 0) {
                        setHighlightPath(item.sample_paths[0]);
                      }
                    }}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.avatar_url}
                          alt={item.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500">{item.institution}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                          Distance: {item.distance} {item.distance === 1 ? 'hop' : 'hops'}
                        </span>
                      </div>
                    </div>

                    {item.sample_paths && item.sample_paths.length > 0 && (
                      <div className="mt-2 text-[10px] font-mono text-cyan-400/80 truncate">
                        Path: [{item.sample_paths[0].join(' → ')}]
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Shortest Path & Connection Finder */}
          {activeTab === 'pathfinder' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Route className="w-4 h-4 text-cyan-400" />
                  <span>Problem 2: Researcher Shortest Path Finder</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Find degrees of separation and shortest follow sequences between two academic scientists.
                </p>
              </div>

              {/* Source & Target Selector */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Source (A)</label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {allUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name} (ID: {u.user_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target (B)</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {allUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name} (ID: {u.user_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunPathFinder}
                disabled={pathLoading || sourceId === targetId}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Compute Connection Paths</span>
              </button>

              {/* Path Finder Meta */}
              {pathMeta && (
                <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                  <span>
                    Shortest: <strong className="text-cyan-400">{pathMeta.shortestDistance ? `${pathMeta.shortestDistance} degrees` : 'Unreachable'}</strong>
                  </span>
                  <span>Execution: <strong className="text-cyan-400">{pathMeta.executionMs} ms</strong></span>
                </div>
              )}

              {/* Discovered Paths */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {foundPaths.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No connection path found within 5 hops.
                  </p>
                ) : (
                  foundPaths.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setHighlightPath(p.path)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-200">Path #{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">
                          {p.distance} steps
                        </span>
                      </div>

                      {/* Intermediate Node Chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.path_nodes.map((node: any, nIdx: number) => (
                          <React.Fragment key={node.user_id}>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
                              {node.name.split(' ')[0]} {node.name.split(' ')[1] || ''}
                            </span>
                            {nIdx < p.path_nodes.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-cyan-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Mutual Followers section */}
              {mutualFollowers.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300 mb-2">
                    Mutual Followers ({mutualFollowers.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mutualFollowers.map((m) => (
                      <span key={m.user_id} className="text-[11px] px-2 py-1 bg-slate-950 rounded text-slate-300 border border-slate-800">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Cycle Detection */}
          {activeTab === 'cycles' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-cyan-400" />
                  <span>Problem 5: Cycle Detection in Academic Follows</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Identify closed feedback loops (e.g. A → B → C → A) in the directed network.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Anchor Node</label>
                <select
                  value={cycleStartUser}
                  onChange={(e) => setCycleStartUser(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {allUsers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name} (ID: {u.user_id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunCycles}
                disabled={cyclesLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cyclesLoading ? 'animate-spin' : ''}`} />
                <span>Detect Directed Cycles</span>
              </button>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cycles.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No closed cycles detected for this researcher.
                  </p>
                ) : (
                  cycles.map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => setHighlightPath(c.path)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-cyan-400">Cycle Loop #{idx + 1}</span>
                        <span className="text-[10px] font-mono text-slate-400">Length: {c.cycle_length} nodes</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        {c.cycle_members.map((m: any) => m.name.split(' ')[0]).join(' → ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Shared Communities */}
          {activeTab === 'communities' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Shared Research Communities</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pairs of researchers sharing common research lab affiliations.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {communities.map((comm, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                      <span>{comm.researcher_1_name} & {comm.researcher_2_name}</span>
                      <span className="text-cyan-400 font-mono text-[11px]">
                        {comm.shared_group_count} common labs
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Labs: {comm.shared_groups.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
