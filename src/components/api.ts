// Enhanced API functions for NestJS backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Initialize tokens from localStorage if available
if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
}

// API request helper with automatic token refresh
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        return await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/pages/login';
        }
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken!);
      }
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return false;
};

// Authentication functions
export const loginUser = async (credentials: { username: string; password: string }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed');
  }

  const data = await response.json();
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;

  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken!);
    localStorage.setItem('refreshToken', refreshToken!);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data;
};

export const logoutUser = async () => {
  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear local storage regardless of API call success
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
};

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!accessToken && !!getCurrentUser();
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

export const isCashier = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'cashier';
};

// Product functions
export const getProducts = async () => {
  const response = await apiRequest('/products');
  return await response.json();
};

export const getProduct = async (barcode: string) => {
  const response = await apiRequest(`/products/barcode/${barcode}`);
  return await response.json();
};

export const createProduct = async (productData: any) => {
  const response = await apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
  return await response.json();
};

export const updateProduct = async (id: number, productData: any) => {
  const response = await apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
  return await response.json();
};

export const deleteProduct = async (id: number) => {
  const response = await apiRequest(`/products/${id}`, {
    method: 'DELETE',
  });
  return response.ok;
};

export const searchProducts = async (query: string) => {
  const response = await apiRequest(`/products/search?q=${encodeURIComponent(query)}`);
  return await response.json();
};

export const adjustStock = async (productId: number, adjustment: { quantity: number; reason: string }) => {
  const response = await apiRequest(`/products/${productId}/adjust-stock`, {
    method: 'POST',
    body: JSON.stringify(adjustment),
  });
  return await response.json();
};

// Category functions
export const getCategories = async () => {
  const response = await apiRequest('/categories');
  return await response.json();
};

export const createCategory = async (categoryData: { name: string; description?: string }) => {
  const response = await apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
  return await response.json();
};

export const updateCategory = async (id: number, categoryData: { name: string; description?: string }) => {
  const response = await apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  });
  return await response.json();
};

export const deleteCategory = async (id: number) => {
  const response = await apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  });
  return response.ok;
};

// Supplier functions
export const getSuppliers = async () => {
  const response = await apiRequest('/suppliers');
  return await response.json();
};

export const createSupplier = async (supplierData: any) => {
  const response = await apiRequest('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData),
  });
  return await response.json();
};

export const updateSupplier = async (id: number, supplierData: any) => {
  const response = await apiRequest(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData),
  });
  return await response.json();
};

export const deleteSupplier = async (id: number) => {
  const response = await apiRequest(`/suppliers/${id}`, {
    method: 'DELETE',
  });
  return response.ok;
};

// Sales functions
export const getSales = async () => {
  const response = await apiRequest('/sales');
  return await response.json();
};

export const createSale = async (saleData: { totalAmount: number }) => {
  const response = await apiRequest('/sales', {
    method: 'POST',
    body: JSON.stringify(saleData),
  });
  return await response.json();
};

export const createSalesDetail = async (detailData: {
  saleId: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
}) => {
  const response = await apiRequest('/sales/details', {
    method: 'POST',
    body: JSON.stringify(detailData),
  });
  return await response.json();
};

// Cash register functions
export const getCashRegister = async () => {
  const response = await apiRequest('/cash');
  return await response.json();
};

export const updateCashRegister = async (data: { cashin?: number; cashout?: number }) => {
  const response = await apiRequest('/cash', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return await response.json();
};

