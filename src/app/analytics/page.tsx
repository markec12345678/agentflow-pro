"use client";

import { useState, useEffect } from "react";
import "../../styles/progress-bars.css";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Bed, 
  Calendar, 
  Download, 
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  CreditCard,
  Hotel,
  UserCheck,
  FileText,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

// Types
interface AnalyticsData {
  revenue: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    yearly: number[];
    total: number;
    trend: "up" | "down" | "stable";
    change: number;
  };
  occupancy: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    yearly: number[];
    average: number;
    trend: "up" | "down" | "stable";
    change: number;
  };
  adr: {
    current: number;
    average: number;
    trend: "up" | "down" | "stable";
    change: number;
  };
  revpar: {
    current: number;
    average: number;
    trend: "up" | "down" | "stable";
    change: number;
  };
  bookingChannels: {
    direct: number;
    bookingcom: number;
    airbnb: number;
    expedia: number;
    other: number;
  };
  demographics: {
    countries: { country: string; guests: number; percentage: number }[];
    ageGroups: { group: string; guests: number; percentage: number }[];
    stayDuration: { duration: string; guests: number; percentage: number }[];
  };
  autoApproval: {
    rate: number;
    trend: "up" | "down" | "stable";
    change: number;
    monthly: number[];
  };
}

interface DateRange {
  start: Date;
  end: Date;
  preset?: "today" | "week" | "month" | "quarter" | "year";
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    preset: "month"
  }));
  const [exporting, setExporting] = useState(false);

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock analytics data
      const mockData: AnalyticsData = {
        revenue: {
          daily: Array.from({ length: 30 }, (_, i) => 1000 + Math.random() * 2000),
          weekly: Array.from({ length: 12 }, (_, i) => 7000 + Math.random() * 8000),
          monthly: Array.from({ length: 12 }, (_, i) => 30000 + Math.random() * 20000),
          yearly: Array.from({ length: 5 }, (_, i) => 400000 + Math.random() * 100000),
          total: 485000,
          trend: "up",
          change: 12.5
        },
        occupancy: {
          daily: Array.from({ length: 30 }, (_, i) => 60 + Math.random() * 35),
          weekly: Array.from({ length: 12 }, (_, i) => 65 + Math.random() * 30),
          monthly: Array.from({ length: 12 }, (_, i) => 70 + Math.random() * 25),
          yearly: Array.from({ length: 5 }, (_, i) => 68 + Math.random() * 20),
          average: 78.5,
          trend: "up",
          change: 5.2
        },
        adr: {
          current: 145.80,
          average: 138.50,
          trend: "up",
          change: 5.3
        },
        revpar: {
          current: 114.45,
          average: 108.65,
          trend: "up",
          change: 5.3
        },
        bookingChannels: {
          direct: 45,
          bookingcom: 25,
          airbnb: 15,
          expedia: 10,
          other: 5
        },
        demographics: {
          countries: [
            { country: "Slovenija", guests: 450, percentage: 45 },
            { country: "Hrvaška", guests: 180, percentage: 18 },
            { country: "Italija", guests: 120, percentage: 12 },
            { country: "Avstrija", guests: 100, percentage: 10 },
            { country: "Nemčija", guests: 80, percentage: 8 },
            { country: "Ostale", guests: 70, percentage: 7 }
          ],
          ageGroups: [
            { group: "25-34", guests: 280, percentage: 28 },
            { group: "35-44", guests: 250, percentage: 25 },
            { group: "45-54", guests: 200, percentage: 20 },
            { group: "18-24", guests: 150, percentage: 15 },
            { group: "55+", guests: 120, percentage: 12 }
          ],
          stayDuration: [
            { duration: "1-2 noči", guests: 400, percentage: 40 },
            { duration: "3-4 noči", guests: 350, percentage: 35 },
            { duration: "5-7 noči", guests: 150, percentage: 15 },
            { duration: "7+ noči", guests: 100, percentage: 10 }
          ]
        },
        autoApproval: {
          rate: 78.5,
          trend: "up",
          change: 8.2,
          monthly: Array.from({ length: 12 }, (_, i) => 70 + Math.random() * 15)
        }
      };

      setData(mockData);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleDateRangeChange = (preset: DateRange["preset"]) => {
    const now = new Date();
    let start = new Date();
    
    switch (preset) {
      case "today":
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    setDateRange({ start, end: now, preset });
  };

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setExporting(false);
    console.log(`Exporting analytics data as ${format.toUpperCase()}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sl-SI", {
      style: "currency",
      currency: "EUR"
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-3 h-3 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nalaganje analitike...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={dateRange.preset || "custom"}
                  onChange={(e) => handleDateRangeChange(e.target.value as any)}
                  aria-label="Select date range"
                  title="Select date range"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="today">Danes</option>
                  <option value="week">Zadnji teden</option>
                  <option value="month">Zadnji mesec</option>
                  <option value="quarter">Zadnje četrtletje</option>
                  <option value="year">Zadnje leto</option>
                </select>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport("csv")}
                  disabled={exporting}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? "Izvažanje..." : "CSV"}</span>
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>{exporting ? "Izvažanje..." : "PDF"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prihodki</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.revenue.total)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  {getTrendIcon(data.revenue.trend)}
                  <span className={`text-sm font-medium ${getChangeColor(data.revenue.change)}`}>
                    {data.revenue.change > 0 ? "+" : ""}{data.revenue.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Occupancy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Zasedenost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.occupancy.average)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  {getTrendIcon(data.occupancy.trend)}
                  <span className={`text-sm font-medium ${getChangeColor(data.occupancy.change)}`}>
                    {data.occupancy.change > 0 ? "+" : ""}{data.occupancy.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Hotel className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* ADR */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ADR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.adr.current)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  {getTrendIcon(data.adr.trend)}
                  <span className={`text-sm font-medium ${getChangeColor(data.adr.change)}`}>
                    {data.adr.change > 0 ? "+" : ""}{data.adr.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Bed className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* RevPAR */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">RevPAR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.revpar.current)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  {getTrendIcon(data.revpar.trend)}
                  <span className={`text-sm font-medium ${getChangeColor(data.revpar.change)}`}>
                    {data.revpar.change > 0 ? "+" : ""}{data.revpar.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Prihodki - Trendi</h2>
              <div className="flex items-center space-x-2">
                {["day", "week", "month", "year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period as any)}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedPeriod === period
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {period === "day" ? "Dnevno" : period === "week" ? "Tedensko" : period === "month" ? "Mesečno" : "Letno"}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Graf prihodkov</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {(data.revenue[selectedPeriod as keyof Omit<typeof data.revenue, 'total' | 'trend' | 'change'>] as number[]).reduce((sum, val) => sum + val, 0).toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Occupancy Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Zasedenost - Trendi</h2>
              <div className="flex items-center space-x-2">
                {["day", "week", "month", "year"].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedPeriod === period
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {period === "day" ? "Dnevno" : period === "week" ? "Tedensko" : period === "month" ? "Mesečno" : "Letno"}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Graf zasedenosti</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Povprečje: {formatPercentage((data.occupancy[selectedPeriod as keyof Omit<typeof data.occupancy, 'average' | 'trend' | 'change'>] as number[]).reduce((sum, val) => sum + val, 0) / (data.occupancy[selectedPeriod as keyof Omit<typeof data.occupancy, 'average' | 'trend' | 'change'>] as number[]).length)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Channels & Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Booking Channels */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Rezervacijski kanali</h2>
            
            <div className="space-y-4">
              {Object.entries(data.bookingChannels).map(([channel, percentage]) => (
                <div key={channel} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {channel === "direct" ? "Direktno" : 
                       channel === "bookingcom" ? "Booking.com" :
                       channel === "airbnb" ? "Airbnb" :
                       channel === "expedia" ? "Expedia" : "Ostalo"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill blue progress-width-24"
                        role="progressbar"
                        aria-valuenow="24"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label="Progress: 24%"
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {formatPercentage(percentage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-approval Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Auto-approval Rate</h2>
              <div className="flex items-center space-x-2">
                {getTrendIcon(data.autoApproval.trend)}
                <span className={`text-sm font-medium ${getChangeColor(data.autoApproval.change)}`}>
                  {data.autoApproval.change > 0 ? "+" : ""}{data.autoApproval.change}%
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Trenutni rate</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.autoApproval.rate)}
                </span>
              </div>
              
              <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <UserCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Mesečni trend</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Demographics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Demografika gostov</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Countries */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Države</h3>
              <div className="space-y-2">
                {data.demographics.countries.map((country) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{country.country}</span>
                    <div className="flex items-center space-x-2">
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill green progress-width-18"
                          role="progressbar"
                          aria-valuenow="18"
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-label="Slovenia: 18%"
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                        {formatPercentage(country.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Groups */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Starostne skupine</h3>
              <div className="space-y-2">
                {data.demographics.ageGroups.map((group) => (
                  <div key={group.group} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{group.group}</span>
                    <div className="flex items-center space-x-2">
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill blue progress-width-35"
                          role="progressbar"
                          aria-valuenow="35"
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-label={`${group.group}: 35%`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                        {formatPercentage(group.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stay Duration */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Trajanje bivanja</h3>
              <div className="space-y-2">
                {data.demographics.stayDuration.map((duration) => (
                  <div key={duration.duration} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{duration.duration}</span>
                    <div className="flex items-center space-x-2">
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill purple progress-width-42"
                          role="progressbar"
                          aria-valuenow="42"
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-label="1-3 noči: 42%"
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                        {formatPercentage(duration.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
