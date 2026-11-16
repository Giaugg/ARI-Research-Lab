'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Terminal, 
  Zap, 
  Shield, 
  BarChart3, 
  Play, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Eye, 
  X, 
  Copy, 
  Check, 
  Clock,
  HardDrive,
  RotateCcw
} from 'lucide-react';
import { api, getActiveUserId, setActiveUserId, User } from '@/lib/api';

export default function AdminSqlLabPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'advanced_sql' | 'performance' | 'transactions'>('overview');
  
  // Current user info & admin check
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // TAB 1: Database Overview & Bulk Data State
  const [dbOverview, setDbOverview] = useState<any | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(false);
  const [bulkCount, setBulkCount] = useState<number>(1000);
  const [bulkType, setBulkType] = useState<string>('users_follows');
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [bulkResult, setBulkResult] = useState<any | null>(null);

  // Reset Data State
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // TAB 2: Advanced SQL Queries State
  const [selectedQueryId, setSelectedQueryId] = useState<number>(1);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // TAB 3: Performance Comparison State
  const [compareScenario, setCompareScenario] = useState<string>('index_vs_seq');
  const [searchTerm, setSearchTerm] = useState<string>('database');
  const [compareLoading, setCompareLoading] = useState<boolean>(false);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [dataTabMethod, setDataTabMethod] = useState<'methodA' | 'methodB'>('methodB');
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [planModalTab, setPlanModalTab] = useState<'tree' | 'rawText'>('tree');

  // TAB 4: Transactions State
  const [txScenarioId, setTxScenarioId] = useState<string>('atomic_commit');
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<any | null>(null);

  // Modal for Single Query Plan
  const [singlePlanModal, setSinglePlanModal] = useState<boolean>(false);

  // Load User & Role
  const loadUser = useCallback(async () => {
    try {
      const activeId = getActiveUserId() || 1;
      const res = await api.getUserById(activeId);
      if (res?.user) {
        setCurrentUser(res.user);
        setIsAdmin(res.user.role === 'admin');
      }
    } catch (e) {
      console.error('Failed to load user', e);
    }
  }, []);

  // Quick switch to admin account
  const switchToAdmin = async () => {
    try {
      // User #2 is Dr. Jennifer Widom (role: 'admin')
      setActiveUserId(2);
      await loadUser();
      window.dispatchEvent(new Event('ari_user_changed'));
    } catch (e) {
      console.error(e);
    }
  };

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await api.getAdminOverview();
      setDbOverview(res);
    } catch (e) {
      console.error(e);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadOverview();
  }, [loadUser, loadOverview]);

  // Run Bulk Generate
  const handleBulkGenerate = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await api.bulkGenerateData(bulkType, bulkCount);
      setBulkResult(res);
      await loadOverview();
    } catch (e: any) {
      alert(e.message || 'Lỗi khi sinh dữ liệu lớn');
    } finally {
      setBulkLoading(false);
    }
  };

  // Run Reset and Seed Database
  const handleResetDatabase = async () => {
    setResetLoading(true);
    setResetSuccessMessage(null);
    try {
      const res = await api.resetAndSeedDatabase();
      setResetSuccessMessage(res.message || 'Đã khôi phục dữ liệu mẫu ban đầu thành công!');
      setShowResetConfirm(false);
      await loadOverview();
      window.dispatchEvent(new Event('ari_user_changed'));
    } catch (e: any) {
      alert(e.message || 'Lỗi khi reset cơ sở dữ liệu');
    } finally {
      setResetLoading(false);
    }
  };

  // Run Advanced Query
  const handleRunAdvancedQuery = async (idToRun?: number) => {
    const qId = idToRun !== undefined ? idToRun : selectedQueryId;
    setQueryLoading(true);
    try {
      const res = await api.runAdminAdvancedQuery(qId, {
        userId: 1,
        maxDepth: 3,
        postId: 1,
        sourceId: 1,
        targetId: 3,
        scope: 'community'
      });
      setQueryResult(res);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi thực thi truy vấn');
    } finally {
      setQueryLoading(false);
    }
  };

  // Run Performance Comparison
  const handleRunCompare = async () => {
    setCompareLoading(true);
    try {
      const res = await api.comparePerformance(compareScenario, { searchTerm });
      setCompareResult(res);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi so sánh hiệu năng');
    } finally {
      setCompareLoading(false);
    }
  };

  // Run Transaction Scenario
  const handleRunTransaction = async () => {
    setTxLoading(true);
    try {
      const res = await api.runTransactionScenario(txScenarioId);
      setTxResult(res);
      if (txScenarioId === 'atomic_commit' || txScenarioId === 'rollback_savepoint') {
        loadOverview();
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi chạy kịch bản giao dịch');
    } finally {
      setTxLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Advanced query catalog definition
  const queryCatalog = [
    { id: 1, category: 'Correlated Subquery', name: '1. Correlated Subquery: Lọc Outlier Likes', tag: 'Subquery' },
    { id: 2, category: 'Phép Chia / Anti-Join', name: '2. NOT EXISTS: Học giả chưa xuất bản bài báo', tag: 'Anti-Join' },
    { id: 3, category: 'Multi-table JOIN', name: '3. Multi-table JOIN & HAVING: Thống kê Lab', tag: 'JOIN' },
    { id: 4, category: 'Window Functions', name: '4. DENSE_RANK() & AVG() OVER (PARTITION BY scope)', tag: 'Window' },
    { id: 5, category: 'Window Functions', name: '5. Phân nhóm NTILE(4) & Xếp hạng kết nối', tag: 'Window' },
    { id: 6, category: 'Dynamic SQL', name: '6. Dynamic SQL: Lọc bài đăng tham số hóa an toàn', tag: 'Dynamic' },
    { id: 7, category: 'Recursive CTE', name: '7. WITH RECURSIVE: N-Hop Follower Reachability', tag: 'Graph' },
    { id: 8, category: 'Recursive CTE', name: '8. WITH RECURSIVE: Cây thảo luận vô hạn cấp (Tree)', tag: 'Hierarchy' },
    { id: 9, category: 'Recursive CTE', name: '9. WITH RECURSIVE: Shortest Path BFS giữa 2 học giả', tag: 'BFS' },
    { id: 10, category: 'Recursive CTE', name: '10. WITH RECURSIVE: Phát hiện chu trình kín (Cycle)', tag: 'Graph' },
    { id: 11, category: 'Set Operations', name: '11. Phép toán Tập hợp: INTERSECT & EXCEPT giữa 2 Lab', tag: 'Set' },
    { id: 12, category: 'Aggregation', name: '12. Gom nhóm đa chiều: ROLLUP Thống kê ấn phẩm', tag: 'Cube' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Admin Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3 text-rose-600" />
                Admin SQL Demo Studio & Performance Lab
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                PostgreSQL 18 Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trung Tâm Quản Trị & Thực Nghiệm Cơ Sở Dữ Liệu Chuyên Sâu
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Bộ công cụ dành cho Quản trị viên và Hội đồng chấm đồ án: Import dữ liệu quy mô lớn, chạy 12 nghiệp vụ SQL nâng cao, so sánh hiệu năng kèm cây truy vấn phân cấp và mô phỏng giao dịch đồng thời ACID.
            </p>
          </div>

          {/* Role status & quick switch */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 shrink-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${isAdmin ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
              {isAdmin ? <Shield className="w-5 h-5 text-rose-600" /> : <Lock className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-500">Tài khoản hiện tại</div>
              <div className="text-xs font-bold text-slate-900">{currentUser?.name || 'Đang tải...'} ({currentUser?.role || 'user'})</div>
            </div>
            {!isAdmin && (
              <button
                onClick={switchToAdmin}
                className="ml-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                Chuyển sang Admin
              </button>
            )}
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resetLoading}
              className="ml-2 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Xóa dữ liệu phát sinh và nạp lại dữ liệu mẫu gốc"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-rose-600 ${resetLoading ? 'animate-spin' : ''}`} />
              <span>Reset Dữ Liệu Mẫu</span>
            </button>
          </div>
        </div>

        {/* 4 Main Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Thống Kê & Sinh Dữ Liệu Lớn</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('advanced_sql');
              if (!queryResult) handleRunAdvancedQuery(selectedQueryId);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'advanced_sql'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>2. 12 Truy Vấn SQL Nâng Cao</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('performance');
              if (!compareResult) handleRunCompare();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'performance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>3. So Sánh Hiệu Năng & Cây Truy Vấn</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('transactions');
              if (!txResult) handleRunTransaction();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Giao Dịch Đồng Thời (ACID)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & BULK DATA GENERATION
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Sizing Summary Header */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Tổng số bảng</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {dbOverview?.totalTables || 12} Bảng quan hệ
              </div>
              <p className="text-xs text-slate-500 mt-1">Đạt chuẩn 3NF / BCNF & 4NF</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Tổng số bản ghi (Rows)</span>
              <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                {dbOverview?.totalRecords ? dbOverview.totalRecords.toLocaleString('vi-VN') : '---'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Toàn bộ 12 quan hệ trong DB</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Dung lượng Database trên đĩa</span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {dbOverview?.totalDatabaseSize || '---'}
              </div>
              <p className="text-xs text-slate-500 mt-1">pg_database_size()</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Hệ quản trị</span>
              <div className="text-lg font-bold text-slate-800 font-mono mt-1 truncate">
                PostgreSQL 18.x
              </div>
              <p className="text-xs text-slate-500 mt-1">Multi-Version Concurrency (MVCC)</p>
            </div>
          </div>

          {/* Bulk Generation Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Trình Sinh Dữ Liệu Lớn Siêu Tốc (PostgreSQL generate_series)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sử dụng kỹ thuật tập hợp (set-based bulk insert) trực tiếp trên PostgreSQL thay vì vòng lặp ứng dụng, cho phép chèn hàng chục nghìn bản ghi chỉ trong vài trăm mili-giây.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="users_follows">Học giả & Đồ thị Follows (Users & Follows)</option>
                  <option value="posts_comments">Bài báo & Cây bình luận (Posts & Comments)</option>
                </select>

                <select
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value={500}>+500 Bản ghi</option>
                  <option value={1000}>+1,000 Bản ghi</option>
                  <option value={5000}>+5,000 Bản ghi (Benchmark vừa)</option>
                  <option value={10000}>+10,000 Bản ghi (Tải cực lớn)</option>
                </select>

                <button
                  onClick={handleBulkGenerate}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${bulkLoading ? 'animate-spin' : ''}`} />
                  <span>{bulkLoading ? 'Đang sinh tập hợp...' : 'Sinh Dữ Liệu Ngay'}</span>
                </button>
              </div>
            </div>

            {bulkResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-950">{bulkResult.message}</span>
                    <span className="ml-2 font-mono text-emerald-700">(Thời gian xử lý: {bulkResult.durationMs} ms)</span>
                  </div>
                </div>
                <button
                  onClick={loadOverview}
                  className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-semibold hover:bg-emerald-100 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới thống kê</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset & Re-Seed Database Card */}
          <div className="bg-white border border-rose-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  <span>Khôi Phục & Nạp Lại Dữ Liệu Mẫu Ban Đầu (Reset & Seed Initial Data)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Xóa sạch mọi dữ liệu kiểm thử phát sinh (<code className="text-rose-700 font-mono bg-rose-50 px-1 py-0.5 rounded border border-rose-200">TRUNCATE ... RESTART IDENTITY CASCADE</code>), đặt lại các chuỗi khóa chính tự tăng SERIAL về 1 và nạp lại đầy đủ 100% dữ liệu mẫu ban đầu của đồ án (10 nhà nghiên cứu, 4 phòng Lab, bài viết, cây bình luận, ấn phẩm DOI và các cạnh đồ thị kết nối).
                </p>
              </div>

              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetLoading ? 'animate-spin' : ''}`} />
                <span>{resetLoading ? 'Đang khôi phục dữ liệu...' : 'Reset & Nạp Dữ Liệu Mẫu'}</span>
              </button>
            </div>

            {resetSuccessMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-950">{resetSuccessMessage}</span>
                </div>
                <button
                  onClick={() => setResetSuccessMessage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Tables Detailed Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-600" />
                  <span>Chi Tiết Kích Thước & Số Bản Ghi Của 12 Bảng Quan Hệ</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đo lường dung lượng thực tế qua <code className="text-blue-700 font-mono">pg_total_relation_size()</code> và <code className="text-blue-700 font-mono">pg_indexes_size()</code>
                </p>
              </div>
              <button
                onClick={loadOverview}
                disabled={overviewLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
                <span>Cập nhật</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[11px]">
                    <th className="p-3">Tên Bảng (Relation)</th>
                    <th className="p-3">Số Dòng (Rows)</th>
                    <th className="p-3">Dung Lượng Dữ Liệu</th>
                    <th className="p-3">Dung Lượng Chỉ Mục (Indexes)</th>
                    <th className="p-3">Tổng Kích Thước</th>
                    <th className="p-3 text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dbOverview?.tables?.map((tbl: any) => (
                    <tr key={tbl.tableName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 font-sans flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {tbl.tableName}
                      </td>
                      <td className="p-3 font-bold text-blue-600">
                        {tbl.rowCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3 text-slate-600">{tbl.tableSize}</td>
                      <td className="p-3 text-amber-700 font-medium">{tbl.indexSize}</td>
                      <td className="p-3 font-bold text-slate-800">{tbl.totalSize}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: 12 ADVANCED SQL QUERIES WITH OUTPUT DATA & EXPLAIN
      ========================================================================= */}
      {activeTab === 'advanced_sql' && (
        <div className="space-y-6">
          {/* Query Selector Catalog */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-600" />
                  <span>Bộ 12 Truy Vấn SQL Nâng Cao Theo Chuẩn Đồ Án</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Thực thi trực tiếp trên PostgreSQL: Trả về tập dữ liệu đầu ra thật, đo đạc thời gian chạy và cây lập lịch EXPLAIN.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedQueryId}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    setSelectedQueryId(id);
                    handleRunAdvancedQuery(id);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white max-w-xs sm:max-w-md"
                >
                  {queryCatalog.map((q) => (
                    <option key={q.id} value={q.id}>
                      [{q.tag}] {q.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleRunAdvancedQuery(selectedQueryId)}
                  disabled={queryLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${queryLoading ? 'animate-spin' : ''}`} />
                  <span>{queryLoading ? 'Đang chạy SQL...' : 'Thực Thi Lại'}</span>
                </button>
              </div>
            </div>

            {/* Query Metadata & Description */}
            {queryResult && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase font-mono">
                    {queryResult.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSinglePlanModal(true)}
                      className="px-3 py-1 bg-white border border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Xem Kế Hoạch EXPLAIN (Plan Tree)</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(queryResult.rawSql)}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 flex items-center gap-1"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'Đã sao chép' : 'Copy SQL'}</span>
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{queryResult.title}</h3>
                <p className="text-xs text-slate-600">{queryResult.description}</p>
              </div>
            )}

            {/* Performance Metric Summary Bar */}
            {queryResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Thời Gian Thực Thi</div>
                  <div className="text-lg font-bold text-blue-600 font-mono mt-0.5">
                    {queryResult.executionTimeMs} ms
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Thời Gian Lập Kế Hoạch</div>
                  <div className="text-lg font-bold text-slate-800 font-mono mt-0.5">
                    {queryResult.planningTimeMs} ms
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Số Dòng Kết Quả</div>
                  <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
                    {queryResult.totalRows} dòng
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Root Node Type</div>
                  <div className="text-xs font-bold text-indigo-700 font-mono mt-1 truncate">
                    {queryResult.planTree?.['Node Type'] || 'Aggregate / Scan'}
                  </div>
                </div>
              </div>
            )}

            {/* Raw SQL Preview */}
            {queryResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-100 shadow-sm">
                <div className="text-[11px] font-bold text-cyan-400 mb-2 flex items-center justify-between">
                  <span>Câu Lệnh SQL Được Thực Thi Trên PostgreSQL:</span>
                  <span className="text-[10px] text-slate-400">Parameter Safe</span>
                </div>
                <pre className="text-emerald-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {queryResult.rawSql}
                </pre>
              </div>
            )}

            {/* DỮ LIỆU ĐẦU RA THẬT (REAL OUTPUT ROWS TABLE) */}
            {queryResult && queryResult.rows && queryResult.rows.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dữ Liệu Đầu Ra Trả Về Từ Database (Output Dataset - {queryResult.rows.length} bản ghi đầu)</span>
                  </h4>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse font-sans">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-mono text-[10px]">
                      <tr>
                        {Object.keys(queryResult.rows[0]).map((col) => (
                          <th key={col} className="p-2.5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {queryResult.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                          {Object.keys(row).map((col) => (
                            <td key={col} className="p-2.5 whitespace-nowrap max-w-xs truncate text-slate-800">
                              {typeof row[col] === 'object' && row[col] !== null
                                ? JSON.stringify(row[col])
                                : String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PERFORMANCE BENCHMARK ARENA & QUERY TREES POPUP
      ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Đấu Trường So Sánh Hiệu Năng & Cây Truy Vấn (Query Plan Trees)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  So sánh đối đầu trực tiếp hai giải pháp (Chưa tối ưu vs Đã tối ưu) cùng trả về một tập dữ liệu đầu ra, kèm popup xem cây thực thi phân cấp.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={compareScenario}
                  onChange={(e) => setCompareScenario(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="index_vs_seq">1. B-tree Index Scan vs Sequential Scan</option>
                  <option value="keyset_vs_offset">2. Keyset Seek vs Deep OFFSET/LIMIT</option>
                  <option value="fts_vs_ilike">3. GIN Inverted tsvector vs ILIKE</option>
                </select>

                {compareScenario === 'fts_vs_ilike' && (
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Từ khóa tìm kiếm..."
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white w-32"
                  />
                )}

                <button
                  onClick={handleRunCompare}
                  disabled={compareLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${compareLoading ? 'animate-spin' : ''}`} />
                  <span>{compareLoading ? 'Đang đo đạc...' : 'Chạy So Sánh Đối Đầu'}</span>
                </button>
              </div>
            </div>

            {compareResult && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                {/* Speedup Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider font-mono">
                      Hệ Số Tăng Tốc (Speedup Factor)
                    </span>
                    <h3 className="text-2xl font-black text-emerald-950 mt-0.5">
                      {compareResult.speedupFactor}x Nhanh Hơn với Giải Pháp Tối Ưu
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1">{compareResult.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPlanModal(true)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all hover:scale-102"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem & So Sánh Cây Truy Vấn (Plan Tree Modal)</span>
                    </button>
                  </div>
                </div>

                {/* Head to Head Side-by-Side Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Method A: Unoptimized */}
                  <div className="bg-slate-50 border border-amber-300 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 font-mono">
                        {compareResult.methodA.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        Chưa Tối Ưu
                      </span>
                    </div>
                    <div className="text-3xl font-black text-amber-700 font-mono">
                      {compareResult.methodA.executionTimeMs} ms
                    </div>
                    <div className="text-xs text-slate-600 font-mono space-y-1 pt-2 border-t border-slate-200">
                      <p>Root Node: <strong className="text-slate-800">{compareResult.methodA.nodeType}</strong></p>
                      <p>Planning Time: <strong className="text-slate-800">{compareResult.methodA.planningTimeMs} ms</strong></p>
                      <p>Total Cost: <strong className="text-slate-800">{compareResult.methodA.totalCost}</strong></p>
                      <p>Shared Hit Blocks: <strong className="text-slate-800">{compareResult.methodA.sharedHitBlocks}</strong></p>
                      <p>Số dòng trả về: <strong className="text-slate-800">{compareResult.methodA.rowsCount}</strong></p>
                    </div>
                  </div>

                  {/* Method B: Optimized */}
                  <div className="bg-slate-50 border border-emerald-300 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 font-mono">
                        {compareResult.methodB.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        Đã Tối Ưu (Advanced)
                      </span>
                    </div>
                    <div className="text-3xl font-black text-emerald-700 font-mono">
                      {compareResult.methodB.executionTimeMs} ms
                    </div>
                    <div className="text-xs text-slate-600 font-mono space-y-1 pt-2 border-t border-slate-200">
                      <p>Root Node: <strong className="text-slate-800">{compareResult.methodB.nodeType}</strong></p>
                      <p>Planning Time: <strong className="text-slate-800">{compareResult.methodB.planningTimeMs} ms</strong></p>
                      <p>Total Cost: <strong className="text-slate-800">{compareResult.methodB.totalCost}</strong></p>
                      <p>Shared Hit Blocks: <strong className="text-slate-800">{compareResult.methodB.sharedHitBlocks}</strong></p>
                      <p>Số dòng trả về: <strong className="text-slate-800">{compareResult.methodB.rowsCount}</strong></p>
                    </div>
                  </div>
                </div>

                {/* DỮ LIỆU ĐẦU RA Ở MỖI TRUY VẤN ĐỂ SO SÁNH */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>Đối Chứng Dữ Liệu Đầu Ra Của Cả Hai Phương Pháp (Data Consistency Verification)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kiểm chứng tính đúng đắn: Cả hai phương pháp trả về cùng một tập dữ liệu chính xác, khẳng định tối ưu hóa không làm sai lệch kết quả.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => setDataTabMethod('methodB')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          dataTabMethod === 'methodB' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Dữ liệu Phương pháp B (Tối ưu)
                      </button>
                      <button
                        onClick={() => setDataTabMethod('methodA')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          dataTabMethod === 'methodA' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Dữ liệu Phương pháp A (Gốc)
                      </button>
                    </div>
                  </div>

                  {/* Render Data Table */}
                  {compareResult[dataTabMethod]?.rows && compareResult[dataTabMethod].rows.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
                          <tr>
                            {Object.keys(compareResult[dataTabMethod].rows[0]).map((col) => (
                              <th key={col} className="p-2.5 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {compareResult[dataTabMethod].rows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                              {Object.keys(row).map((col) => (
                                <td key={col} className="p-2.5 whitespace-nowrap text-slate-800">
                                  {typeof row[col] === 'object' && row[col] !== null
                                    ? JSON.stringify(row[col])
                                    : String(row[col] ?? 'NULL')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 font-mono">
                      Không có bản ghi nào được trả về.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CONCURRENT TRANSACTIONS & ACID DEMO
      ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Kịch Bản Giao Dịch Đồng Thời & Cơ Chế Khóa ACID (PostgreSQL MVCC)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Mô phỏng cạnh tranh tài nguyên giữa các phiên làm việc song song, xử lý Lost Update bằng khóa dòng bi quan và phục hồi từng phần qua SAVEPOINT.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={txScenarioId}
                  onChange={(e) => setTxScenarioId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="atomic_commit">Kịch bản 1: Giao dịch thành công nguyên tử (COMMIT)</option>
                  <option value="rollback_savepoint">Kịch bản 2: Lỗi giữa chừng & Phục hồi bằng SAVEPOINT</option>
                  <option value="lost_update_simulation">Kịch bản 3: Ngăn chặn Lost Update (SELECT FOR UPDATE)</option>
                  <option value="isolation_levels">Kịch bản 4: So sánh Mức Cô Lập (Read Committed vs Repeatable Read)</option>
                </select>

                <button
                  onClick={handleRunTransaction}
                  disabled={txLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${txLoading ? 'animate-spin' : ''}`} />
                  <span>{txLoading ? 'Đang thực thi kịch bản...' : 'Chạy Kịch Bản Giao Dịch'}</span>
                </button>
              </div>
            </div>

            {/* Transaction Timeline Results */}
            {txResult && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-blue-700 uppercase font-bold">
                      Trạng Thái Hoàn Tất
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{txResult.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{txResult.summary}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {txResult.outcome}
                  </span>
                </div>

                {/* Timeline Interactive Step by Step */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Dòng Thời Gian Các Thao Tác Trong Phiên Giao Dịch (Execution Timeline)</span>
                  </h4>

                  <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-4">
                    {txResult.timeline?.map((item: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-2xs"></div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-700">
                              Bước {item.step}: [{item.session}] {item.action}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">ACID Controlled</span>
                          </div>
                          <p className="text-slate-700">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra context if any */}
                {txResult.caughtError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Thông Báo Lỗi Được Bắt Giữ An Toàn Bởi PostgreSQL:</span>
                    </div>
                    <p className="text-[11px]">{txResult.caughtError}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP MODAL: SIDE-BY-SIDE QUERY PLAN TREES COMPARISON
      ========================================================================= */}
      {showPlanModal && compareResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cây Kế Hoạch Truy Vấn EXPLAIN ANALYZE (Execution Plan Tree Comparison)
                  </h3>
                  <p className="text-xs text-slate-500">
                    So sánh cấu trúc cây phân cấp các toán tử của PostgreSQL Optimizer giữa 2 phương pháp.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
                  <button
                    onClick={() => setPlanModalTab('tree')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      planModalTab === 'tree' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cây Phân Cấp Trực Quan (Tree View)
                  </button>
                  <button
                    onClick={() => setPlanModalTab('rawText')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      planModalTab === 'rawText' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    EXPLAIN Raw Text
                  </button>
                </div>

                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {planModalTab === 'tree' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tree A: Unoptimized */}
                  <div className="bg-slate-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <span className="text-xs font-bold text-amber-800 font-mono">
                        {compareResult.methodA.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        {compareResult.methodA.executionTimeMs} ms
                      </span>
                    </div>

                    {/* Hierarchical Node Breakdown */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-3 bg-white border border-amber-200 rounded-lg shadow-2xs space-y-1">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span>Toán tử Gốc: {compareResult.methodA.nodeType}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 pl-4 space-y-0.5">
                          <p>Total Cost: {compareResult.methodA.totalCost}</p>
                          <p>Planning: {compareResult.methodA.planningTimeMs} ms</p>
                          <p>Execution: {compareResult.methodA.executionTimeMs} ms</p>
                          <p>Shared Hit Blocks: {compareResult.methodA.sharedHitBlocks}</p>
                        </div>
                      </div>

                      {/* Child Plan nodes if any */}
                      {compareResult.methodA.planTree?.Plans?.map((subNode: any, idx: number) => (
                        <div key={idx} className="ml-4 p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="text-slate-400">└─</span>
                            <span>{subNode['Node Type']} ({subNode['Relation Name'] || 'Subplan'})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 pl-4">
                            Cost: {subNode['Startup Cost']}..{subNode['Total Cost']} | Rows: {subNode['Plan Rows']}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tree B: Optimized */}
                  <div className="bg-slate-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                      <span className="text-xs font-bold text-emerald-800 font-mono">
                        {compareResult.methodB.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {compareResult.methodB.executionTimeMs} ms
                      </span>
                    </div>

                    {/* Hierarchical Node Breakdown */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-3 bg-white border border-emerald-200 rounded-lg shadow-2xs space-y-1">
                        <div className="flex items-center gap-2 font-bold text-emerald-900">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>Toán tử Gốc: {compareResult.methodB.nodeType}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 pl-4 space-y-0.5">
                          <p>Total Cost: {compareResult.methodB.totalCost}</p>
                          <p>Planning: {compareResult.methodB.planningTimeMs} ms</p>
                          <p>Execution: {compareResult.methodB.executionTimeMs} ms</p>
                          <p>Shared Hit Blocks: {compareResult.methodB.sharedHitBlocks}</p>
                        </div>
                      </div>

                      {/* Child Plan nodes if any */}
                      {compareResult.methodB.planTree?.Plans?.map((subNode: any, idx: number) => (
                        <div key={idx} className="ml-4 p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="text-emerald-500 font-bold">└─</span>
                            <span>{subNode['Node Type']} ({subNode['Relation Name'] || subNode['Index Name'] || 'Index Scan'})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 pl-4">
                            Cost: {subNode['Startup Cost']}..{subNode['Total Cost']} | Rows: {subNode['Plan Rows']}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="bg-slate-900 text-amber-200 p-4 rounded-xl overflow-x-auto">
                    <div className="text-xs font-bold text-slate-400 mb-2">EXPLAIN Method A (Unoptimized):</div>
                    <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                      {compareResult.methodA.planText}
                    </pre>
                  </div>
                  <div className="bg-slate-900 text-emerald-300 p-4 rounded-xl overflow-x-auto">
                    <div className="text-xs font-bold text-cyan-400 mb-2">EXPLAIN Method B (Optimized):</div>
                    <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                      {compareResult.methodB.planText}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POPUP MODAL: SINGLE QUERY EXPLAIN PLAN
      ========================================================================= */}
      {singlePlanModal && queryResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Kế Hoạch Thực Thi EXPLAIN (ANALYZE, BUFFERS) - {queryResult.title}
                </h3>
              </div>
              <button
                onClick={() => setSinglePlanModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs bg-slate-900 text-emerald-300">
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                {queryResult.planText}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSinglePlanModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Database Reset & Seed */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Khôi Phục Dữ Liệu Ban Đầu?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thao tác này sẽ thực thi lệnh <strong>TRUNCATE CASCADE</strong> trên toàn bộ 12 bảng để xóa toàn bộ dữ liệu kiểm thử, sau đó tự động nạp lại <strong>dữ liệu mẫu học thuật ban đầu</strong> (10 học giả, 4 phòng Lab, 5 bài viết, cây bình luận và mạng lưới trích dẫn chuẩn).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={resetLoading}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                {resetLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang nạp lại...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đồng Ý Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
