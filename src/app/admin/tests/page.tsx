"use client";

import { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Filter, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Eye, 
  EyeOff,
  GitBranch,
  Package,
  Terminal,
  Code,
  Database,
  Globe,
  Shield,
  Zap,
  Timer,
  Activity,
  List,
  Grid,
  PlayCircle,
  SkipForward,
  Flag,
  Award,
  Target,
  Rocket
} from "lucide-react";

interface TestSuite {
  id: string;
  name: string;
  category: "unit" | "integration" | "e2e" | "performance" | "security";
  description: string;
  status: "idle" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  tests: Test[];
  lastRun?: string;
  passRate: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

interface Test {
  id: string;
  name: string;
  status: "idle" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  error?: string;
  category: string;
}

interface TestResult {
  id: string;
  suiteId: string;
  suiteName: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  environment: string;
  branch: string;
  commit: string;
}

interface PipelineStatus {
  id: string;
  name: string;
  status: "success" | "failed" | "running" | "pending" | "cancelled";
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  timestamp: string;
  duration?: number;
  stages: {
    name: string;
    status: "success" | "failed" | "running" | "pending" | "skipped";
    duration?: number;
  }[];
}

export default function TestsPage() {
  const [activeTab, setActiveTab] = useState("suites");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // Mock test suites
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: "unit-tests",
      name: "Unit Tests",
      category: "unit",
      description: "Core functionality unit tests",
      status: "idle",
      tests: [
        { id: "ut1", name: "User authentication", status: "idle", category: "auth" },
        { id: "ut2", name: "Database operations", status: "idle", category: "database" },
        { id: "ut3", name: "API endpoints", status: "idle", category: "api" },
        { id: "ut4", name: "Utility functions", status: "idle", category: "utils" }
      ],
      passRate: 95.2,
      coverage: {
        lines: 87,
        functions: 92,
        branches: 78,
        statements: 89
      }
    },
    {
      id: "integration-tests",
      name: "Integration Tests",
      category: "integration",
      description: "Component integration tests",
      status: "idle",
      tests: [
        { id: "it1", name: "Database + API", status: "idle", category: "database-api" },
        { id: "it2", name: "Auth + Permissions", status: "idle", category: "auth-permissions" },
        { id: "it3", name: "Payment + Booking", status: "idle", category: "payment-booking" },
        { id: "it4", name: "Email + Notifications", status: "idle", category: "email-notifications" }
      ],
      passRate: 88.7,
      coverage: {
        lines: 72,
        functions: 78,
        branches: 65,
        statements: 74
      }
    },
    {
      id: "e2e-tests",
      name: "End-to-End Tests",
      category: "e2e",
      description: "Full application flow tests",
      status: "idle",
      tests: [
        { id: "e2e1", name: "User registration flow", status: "idle", category: "user-flow" },
        { id: "e2e2", name: "Booking process", status: "idle", category: "booking-flow" },
        { id: "e2e3", name: "Payment processing", status: "idle", category: "payment-flow" },
        { id: "e2e4", name: "Admin dashboard", status: "idle", category: "admin-flow" }
      ],
      passRate: 91.3,
      coverage: {
        lines: 65,
        functions: 70,
        branches: 58,
        statements: 67
      }
    },
    {
      id: "performance-tests",
      name: "Performance Tests",
      category: "performance",
      description: "Load and stress testing",
      status: "idle",
      tests: [
        { id: "perf1", name: "API load test", status: "idle", category: "api-load" },
        { id: "perf2", name: "Database performance", status: "idle", category: "db-performance" },
        { id: "perf3", name: "Frontend rendering", status: "idle", category: "frontend-render" },
        { id: "perf4", name: "Memory usage", status: "idle", category: "memory-usage" }
      ],
      passRate: 85.0,
      coverage: {
        lines: 45,
        functions: 50,
        branches: 38,
        statements: 47
      }
    },
    {
      id: "security-tests",
      name: "Security Tests",
      category: "security",
      description: "Security vulnerability tests",
      status: "idle",
      tests: [
        { id: "sec1", name: "Authentication security", status: "idle", category: "auth-security" },
        { id: "sec2", name: "Input validation", status: "idle", category: "input-validation" },
        { id: "sec3", name: "SQL injection", status: "idle", category: "sql-injection" },
        { id: "sec4", name: "XSS protection", status: "idle", category: "xss-protection" }
      ],
      passRate: 94.5,
      coverage: {
        lines: 78,
        functions: 85,
        branches: 70,
        statements: 80
      }
    }
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: "result_1",
      suiteId: "unit-tests",
      suiteName: "Unit Tests",
      status: "passed",
      duration: 2450,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      totalTests: 156,
      passedTests: 148,
      failedTests: 8,
      skippedTests: 0,
      coverage: {
        lines: 87,
        functions: 92,
        branches: 78,
        statements: 89
      },
      environment: "development",
      branch: "main",
      commit: "abc123def"
    },
    {
      id: "result_2",
      suiteId: "integration-tests",
      suiteName: "Integration Tests",
      status: "failed",
      duration: 5200,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      totalTests: 45,
      passedTests: 40,
      failedTests: 5,
      skippedTests: 0,
      coverage: {
        lines: 72,
        functions: 78,
        branches: 65,
        statements: 74
      },
      environment: "staging",
      branch: "feature/new-ui",
      commit: "def456ghi"
    },
    {
      id: "result_3",
      suiteId: "e2e-tests",
      suiteName: "End-to-End Tests",
      status: "passed",
      duration: 12400,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      totalTests: 28,
      passedTests: 26,
      failedTests: 2,
      skippedTests: 0,
      coverage: {
        lines: 65,
        functions: 70,
        branches: 58,
        statements: 67
      },
      environment: "production",
      branch: "main",
      commit: "ghi789jkl"
    }
  ]);

  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus[]>([
    {
      id: "pipeline_1",
      name: "CI Pipeline",
      status: "success",
      branch: "main",
      commit: "abc123def",
      commitMessage: "Fix authentication bug",
      author: "John Doe",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      duration: 125000,
      stages: [
        { name: "Build", status: "success", duration: 45000 },
        { name: "Test", status: "success", duration: 60000 },
        { name: "Deploy", status: "success", duration: 20000 }
      ]
    },
    {
      id: "pipeline_2",
      name: "CI Pipeline",
      status: "failed",
      branch: "feature/payment",
      commit: "def456ghi",
      commitMessage: "Add payment integration",
      author: "Jane Smith",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      duration: 89000,
      stages: [
        { name: "Build", status: "success", duration: 42000 },
        { name: "Test", status: "failed", duration: 47000 },
        { name: "Deploy", status: "skipped", duration: 0 }
      ]
    },
    {
      id: "pipeline_3",
      name: "CI Pipeline",
      status: "running",
      branch: "develop",
      commit: "ghi789jkl",
      commitMessage: "Update dependencies",
      author: "Bob Johnson",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      stages: [
        { name: "Build", status: "success", duration: 38000 },
        { name: "Test", status: "running", duration: undefined },
        { name: "Deploy", status: "pending", duration: undefined }
      ]
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-500" />;
      case "running": return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "skipped":
      case "pending": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "cancelled": return <Square className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      case "running": return "bg-blue-100 text-blue-800 border-blue-200";
      case "skipped":
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "unit": return <Code className="w-4 h-4" />;
      case "integration": return <Database className="w-4 h-4" />;
      case "e2e": return <Globe className="w-4 h-4" />;
      case "performance": return <Zap className="w-4 h-4" />;
      case "security": return <Shield className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleRunAllTests = async () => {
    setLoading(true);
    setIsRunning(true);
    
    // Simulate running all tests
    for (const suite of testSuites) {
      setTestSuites(prev => prev.map(s => 
        s.id === suite.id ? { ...s, status: "running" as const } : s
      ));
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      const passed = Math.random() > 0.2;
      setTestSuites(prev => prev.map(s => 
        s.id === suite.id ? { 
          ...s, 
          status: passed ? "passed" as const : "failed" as const,
          duration: Math.floor(Math.random() * 10000) + 1000,
          lastRun: new Date().toISOString()
        } : s
      ));
    }
    
    setLoading(false);
    setIsRunning(false);
  };

  const handleRunSpecificSuite = async (suiteId: string) => {
    setLoading(true);
    setCurrentTest(suiteId);
    
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { ...s, status: "running" as const } : s
    ));
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
    
    const passed = Math.random() > 0.3;
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { 
        ...s, 
        status: passed ? "passed" as const : "failed" as const,
        duration: Math.floor(Math.random() * 8000) + 2000,
        lastRun: new Date().toISOString()
      } : s
    ));
    
    setLoading(false);
    setCurrentTest(null);
  };

  const filteredSuites = testSuites.filter(suite => {
    const matchesCategory = selectedCategory === "all" || suite.category === selectedCategory;
    const matchesSearch = suite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suite.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const overallStats = {
    totalSuites: testSuites.length,
    passedSuites: testSuites.filter(s => s.status === "passed").length,
    failedSuites: testSuites.filter(s => s.status === "failed").length,
    runningSuites: testSuites.filter(s => s.status === "running").length,
    averageCoverage: testSuites.reduce((sum, s) => sum + (s.coverage?.lines || 0), 0) / testSuites.length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Terminal className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Test Suite</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRunAllTests}
                disabled={loading || isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {loading && isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Run All Tests</span>
                  </>
                )}
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Calendar className="w-4 h-4" />
                <span>Schedule Tests</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Suites Tab */}
        {activeTab === "suites" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Suites</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.totalSuites}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Passed</p>
                    <p className="text-2xl font-bold text-green-600">{overallStats.passedSuites}</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{overallStats.failedSuites}</p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Running</p>
                    <p className="text-2xl font-bold text-blue-600">{overallStats.runningSuites}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Coverage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.averageCoverage.toFixed(1)}%</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search test suites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Select test category"
                  title="Select test category"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="unit">Unit Tests</option>
                  <option value="integration">Integration Tests</option>
                  <option value="e2e">E2E Tests</option>
                  <option value="performance">Performance Tests</option>
                  <option value="security">Security Tests</option>
                </select>
              </div>
            </div>

            {/* Test Suites */}
            <div className="space-y-4">
              {filteredSuites.map((suite) => (
                <div key={suite.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getCategoryIcon(suite.category)}
                        <div>
                          <h3 className="text-md font-medium text-gray-900 dark:text-white">{suite.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{suite.description}</p>
                          {suite.lastRun && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Last run: {new Date(suite.lastRun).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</p>
                          <p className="text-md font-medium">{suite.passRate}%</p>
                        </div>
                        
                        {suite.coverage && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                            <p className="text-md font-medium">{suite.coverage.lines}%</p>
                          </div>
                        )}
                        
                        {suite.duration && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                            <p className="text-md font-medium">{(suite.duration / 1000).toFixed(1)}s</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(suite.status)}`}>
                            {getStatusIcon(suite.status)}
                            <span className="ml-1 capitalize">{suite.status}</span>
                          </span>
                          
                          <button
                            onClick={() => setShowDetails(showDetails === suite.id ? null : suite.id)}
                            aria-label={`Show details for ${suite.name}`}
                            title={`Show details for ${suite.name}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleRunSpecificSuite(suite.id)}
                            disabled={loading || isRunning}
                            aria-label={`Run ${suite.name}`}
                            title={`Run ${suite.name}`}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                          >
                            {loading && currentTest === suite.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {showDetails === suite.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tests ({suite.tests.length})</h4>
                            <div className="space-y-1">
                              {suite.tests.map((test) => (
                                <div key={test.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{test.name}</span>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(test.status)}`}>
                                    {test.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {suite.coverage && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Coverage</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Lines</span>
                                  <span className="text-gray-900 dark:text-white">{suite.coverage.lines}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Functions</span>
                                  <span className="text-gray-900 dark:text-white">{suite.coverage.functions}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Branches</span>
                                  <span className="text-gray-900 dark:text-white">{suite.coverage.branches}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Statements</span>
                                  <span className="text-gray-900 dark:text-white">{suite.coverage.statements}%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Test Results History</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Suite
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Coverage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Environment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {testResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.suiteName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                            {getStatusIcon(result.status)}
                            <span className="ml-1 capitalize">{result.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div>{result.passedTests}/{result.totalTests} passed</div>
                          {result.failedTests > 0 && (
                            <div className="text-red-500">{result.failedTests} failed</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {(result.duration / 1000).toFixed(1)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {result.coverage ? `${result.coverage.lines}%` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div>{result.environment}</div>
                          <div className="text-xs">{result.branch}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(result.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">CI/CD Pipeline Status</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {pipelineStatus.filter(p => p.status === "running").length} running
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {pipelineStatus.map((pipeline) => (
                <div key={pipeline.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(pipeline.status)}
                      <div>
                        <h3 className="text-md font-medium text-gray-900 dark:text-white">{pipeline.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pipeline.commitMessage} by {pipeline.author}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Branch: {pipeline.branch} • Commit: {pipeline.commit.substring(0, 7)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="text-md font-medium">
                          {pipeline.duration ? `${(pipeline.duration / 1000).toFixed(1)}s` : "Running..."}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(pipeline.status)}`}>
                        {getStatusIcon(pipeline.status)}
                        <span className="ml-1 capitalize">{pipeline.status}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Pipeline Stages</h4>
                    <div className="flex items-center space-x-4">
                      {pipeline.stages.map((stage, index) => (
                        <div key={stage.name} className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(stage.status)}`}>
                            {getStatusIcon(stage.status)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{stage.name}</p>
                            {stage.duration && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(stage.duration / 1000).toFixed(1)}s
                              </p>
                            )}
                          </div>
                          {index < pipeline.stages.length - 1 && (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: "suites", name: "Test Suites", icon: List },
                { id: "results", name: "Results", icon: BarChart3 },
                { id: "pipeline", name: "CI/CD Pipeline", icon: GitBranch }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
