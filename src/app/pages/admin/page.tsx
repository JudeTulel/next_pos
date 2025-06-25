"use client";
import React, { useState, useEffect } from "react";
import SideBar from "@/components/SideBar";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Smartphone, Package, 
  Users, Calendar, Clock, BarChart3, PieChart as PieChartIcon,
  RefreshCw, Download, Filter, AlertTriangle, CheckCircle,
  User, LogOut, Shield
} from "lucide-react";
import { 
  getSales, 
  getProducts, 
  getCashRegister,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  logoutUser
} from "@/components/api";

// Mock data generator for demonstration
const generateMockData = () => {
  const today = new Date();
  const hourlyData = [];
  const dailyData = [];
  const monthlyData = [];

  // Generate hourly data for today
  for (let i = 0; i < 24; i++) {
    hourlyData.push({
      hour: `${i}:00`,
      sales: Math.floor(Math.random() * 1000) + 100,
      transactions: Math.floor(Math.random() * 50) + 5,
      cash: Math.floor(Math.random() * 600) + 50,
      mpesa: Math.floor(Math.random() * 400) + 50
    });
  }

  // Generate daily data for last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dailyData.push({
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 5000) + 1000,
      transactions: Math.floor(Math.random() * 200) + 20,
      cash: Math.floor(Math.random() * 3000) + 500,
      mpesa: Math.floor(Math.random() * 2000) + 500
    });
  }

  // Generate monthly data for last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      sales: Math.floor(Math.random() * 50000) + 10000,
      transactions: Math.floor(Math.random() * 2000) + 200,
      cash: Math.floor(Math.random() * 30000) + 5000,
      mpesa: Math.floor(Math.random() * 20000) + 5000
    });
  }

  return { hourlyData, dailyData, monthlyData };
};

const AdminDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [data, setData] = useState(generateMockData());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const [realData, setRealData] = useState<any>({
    sales: [],
    products: [],
    cashRegister: null
  });

  // Mock balances - In real app, fetch from API
  const [cashBalance] = useState(12450.75);
  const [mpesaBalance] = useState(8320.50);

  useEffect(() => {
    // Check authentication and admin access
    if (!isAuthenticated()) {
      window.location.href = '/pages/login';
      return;
    }
    
    if (!isAdmin()) {
      window.location.href = '/pages/cashier';
      return;
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Load real data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [salesData, productsData, cashData] = await Promise.all([
        getSales().catch(() => []),
        getProducts().catch(() => []),
        getCashRegister().catch(() => null)
      ]);
      
      setRealData({
        sales: salesData,
        products: productsData,
        cashRegister: cashData
      });
      
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setData(generateMockData());
      setLastUpdated(new Date());
      loadDashboardData();
    }, 1000);
  };

  const getCurrentData = () => {
    switch (timeRange) {
      case 'hourly': return data.hourlyData;
      case 'monthly': return data.monthlyData;
      default: return data.dailyData;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = '/pages/login';
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = '/pages/login';
    }
  };

  // Calculate metrics from real data
  const todaysSales = realData.sales.reduce((sum: number, sale: any) => {
    const saleDate = new Date(sale.createdAt || sale.date);
    const today = new Date();
    if (saleDate.toDateString() === today.toDateString()) {
      return sum + (sale.totalAmount || 0);
    }
    return sum;
  }, 0);

  const todaysTransactions = realData.sales.filter((sale: any) => {
    const saleDate = new Date(sale.createdAt || sale.date);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }).length;

  const lowStockProducts = realData.products.filter((product: any) => 
    product.stock <= (product.minStock || 10)
  );

  const popularProducts = realData.products
    .sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0))
    .slice(0, 5)
    .map((product: any, index: number) => ({
      name: product.name,
      sales: product.sales || Math.floor(Math.random() * 200) + 50,
      revenue: (product.sales || 50) * product.price,
      percentage: ((product.sales || 50) / 1000) * 100
    }));

  const stockLevels = realData.products.slice(0, 5).map((product: any) => ({
    product: product.name,
    current: product.stock || Math.floor(Math.random() * 100),
    minimum: product.minStock || 20,
    status: (product.stock || 50) <= (product.minStock || 20) ? 
      (product.stock || 50) <= (product.minStock || 20) * 0.5 ? 'critical' : 'low' : 'good'
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-success-green';
      case 'low': return 'text-warning-orange';
      case 'critical': return 'text-error-red';
      default: return 'text-warm-grey';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-success-green/20';
      case 'low': return 'bg-warning-orange/20';
      case 'critical': return 'bg-error-red/20';
      default: return 'bg-warm-grey/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-charcoal via-slate-grey to-light-grey">
      <SideBar />
      
      {/* Top Bar */}
      <div className="fixed top-0 left-20 right-0 bg-slate-grey/95 backdrop-blur-xl border-b border-light-grey/20 z-30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-off-white flex items-center space-x-2">
              <Shield className="w-6 h-6 text-maroon" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-sm text-warm-grey">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-warm-grey">
              <User size={16} />
              <span>{user?.username} (ADMIN)</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-error-red/20 hover:bg-error-red/30 rounded-lg transition-colors duration-200 text-error-red"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="ml-20 p-6 pt-24">
        {/* Header Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-grey rounded-lg p-1">
                {(['hourly', 'daily', 'monthly'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      timeRange === range
                        ? 'bg-maroon text-off-white shadow-lg'
                        : 'text-warm-grey hover:text-off-white hover:bg-light-grey/50'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
              
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card group hover:scale-105 transition-transform duration-200 border border-light-grey/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warm-grey text-sm font-medium">Cash Balance</p>
                <p className="text-2xl font-bold text-off-white">${(realData.cashRegister?.opening || cashBalance).toLocaleString()}</p>
                <p className="text-success-green text-sm flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  +12.5% from yesterday
                </p>
              </div>
              <div className="p-3 bg-maroon/20 rounded-lg group-hover:bg-maroon/30 transition-colors duration-200">
                <DollarSign className="w-6 h-6 text-maroon" />
              </div>
            </div>
          </div>

          <div className="card group hover:scale-105 transition-transform duration-200 border border-light-grey/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warm-grey text-sm font-medium">Today's Sales</p>
                <p className="text-2xl font-bold text-off-white">${todaysSales.toLocaleString()}</p>
                <p className="text-success-green text-sm flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  +15.2% from yesterday
                </p>
              </div>
              <div className="p-3 bg-maroon/20 rounded-lg group-hover:bg-maroon/30 transition-colors duration-200">
                <BarChart3 className="w-6 h-6 text-maroon" />
              </div>
            </div>
          </div>

          <div className="card group hover:scale-105 transition-transform duration-200 border border-light-grey/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warm-grey text-sm font-medium">Transactions</p>
                <p className="text-2xl font-bold text-off-white">{todaysTransactions}</p>
                <p className="text-success-green text-sm flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  +8.3% from yesterday
                </p>
              </div>
              <div className="p-3 bg-maroon/20 rounded-lg group-hover:bg-maroon/30 transition-colors duration-200">
                <Users className="w-6 h-6 text-maroon" />
              </div>
            </div>
          </div>

          <div className="card group hover:scale-105 transition-transform duration-200 border border-light-grey/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warm-grey text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold text-off-white">{lowStockProducts.length}</p>
                <p className={`text-sm flex items-center mt-1 ${lowStockProducts.length > 0 ? 'text-warning-orange' : 'text-success-green'}`}>
                  {lowStockProducts.length > 0 ? (
                    <>
                      <AlertTriangle size={14} className="mr-1" />
                      Needs attention
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} className="mr-1" />
                      All good
                    </>
                  )}
                </p>
              </div>
              <div className="p-3 bg-maroon/20 rounded-lg group-hover:bg-maroon/30 transition-colors duration-200">
                <Package className="w-6 h-6 text-maroon" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Time Series */}
          <div className="card border border-light-grey/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-off-white">Sales Trend</h3>
              <div className="flex items-center space-x-2 text-sm text-warm-grey">
                <Calendar size={16} />
                <span>{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} View</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getCurrentData()}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b1538" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b1538" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis 
                    dataKey={timeRange === 'hourly' ? 'hour' : timeRange === 'monthly' ? 'month' : 'date'} 
                    stroke="#718096" 
                    fontSize={12}
                  />
                  <YAxis stroke="#718096" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2d3748', 
                      border: '1px solid #4a5568',
                      borderRadius: '8px',
                      color: '#f7fafc'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8b1538" 
                    strokeWidth={2}
                    fill="url(#salesGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card border border-light-grey/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-off-white">Payment Methods</h3>
              <PieChartIcon size={20} className="text-warm-grey" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Cash', value: cashBalance, color: '#8b1538' },
                      { name: 'M-Pesa', value: mpesaBalance, color: '#a53e5c' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Cash', value: cashBalance, color: '#8b1538' },
                      { name: 'M-Pesa', value: mpesaBalance, color: '#a53e5c' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2d3748', 
                      border: '1px solid #4a5568',
                      borderRadius: '8px',
                      color: '#f7fafc'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-maroon rounded-full"></div>
                <span className="text-sm text-warm-grey">Cash (${cashBalance.toLocaleString()})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-light-maroon rounded-full"></div>
                <span className="text-sm text-warm-grey">M-Pesa (${mpesaBalance.toLocaleString()})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Products & Stock Levels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Products */}
          <div className="card border border-light-grey/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-off-white">Popular Products</h3>
              <BarChart3 size={20} className="text-warm-grey" />
            </div>
            <div className="space-y-4">
              {popularProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-4 bg-deep-charcoal/30 rounded-lg hover:bg-deep-charcoal/50 transition-colors duration-200 border border-light-grey/10">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-maroon/20 rounded-lg flex items-center justify-center">
                      <span className="text-maroon font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-off-white">{product.name}</p>
                      <p className="text-sm text-warm-grey">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-maroon">${product.revenue.toFixed(2)}</p>
                    <p className="text-sm text-warm-grey">{product.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Levels */}
          <div className="card border border-light-grey/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-off-white">Stock Levels</h3>
              <Package size={20} className="text-warm-grey" />
            </div>
            <div className="space-y-4">
              {stockLevels.map((item) => (
                <div key={item.product} className="p-4 bg-deep-charcoal/30 rounded-lg border border-light-grey/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-off-white">{item.product}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(item.status)} ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-grey">Current: {item.current}</span>
                    <span className="text-warm-grey">Min: {item.minimum}</span>
                  </div>
                  <div className="mt-2 w-full bg-light-grey/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.status === 'critical' ? 'bg-error-red' :
                        item.status === 'low' ? 'bg-warning-orange' : 'bg-success-green'
                      }`}
                      style={{ width: `${Math.min((item.current / (item.minimum * 2)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

