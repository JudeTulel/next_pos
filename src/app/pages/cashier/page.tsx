"use client";
import React, { useState, useEffect } from "react";
import ScannerInput from "@/components/ScannerInput";
import Cart, { CartItem } from "@/components/Cart";
import CheckoutModal from "@/components/CheckoutModal";
import ProductList from "@/components/ProductList";
import SearchBar from "@/components/SearchBar";
import SideBar from "@/components/SideBar";
import { 
  getProduct, 
  getProducts, 
  createProduct, 
  searchProducts,
  createSale,
  createSalesDetail,
  updateCashRegister,
  getCurrentUser,
  isAuthenticated,
  logoutUser
} from "../../../components/api";
import { Package, Plus, X, DollarSign, Smartphone, LogOut, User } from "lucide-react";

const CashierPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: '', 
    barcode: '', 
    description: '',
    stock: '',
    minStock: '',
    categoryId: ''
  });
  const [showCart, setShowCart] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
   
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Load initial data
    loadInventory();
  }, []);

  useEffect(() => {
    setTotal(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  }, [cart]);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const data = await getProducts();
      setInventory(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      alert("Failed to load inventory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (barcode: string) => {
    try {
      setIsLoading(true);
      const product = await getProduct(barcode);
      addToCart(product);
    } catch (err) {
      alert("Product not found");
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.barcode === product.barcode);
      if (existing) {
        return prev.map(item =>
          item.barcode === product.barcode ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        barcode: product.barcode, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        productId: product.id
      }];
    });
  };

  const handleQuantityChange = (barcode: string, quantity: number) => {
    setCart(prev =>
      prev.map(item =>
        item.barcode === barcode ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const handleRemove = (barcode: string) => {
    setCart(prev => prev.filter(item => item.barcode !== barcode));
  };

  const handleCashCheckout = async (amount: number) => {
    try {
      setIsLoading(true);
      
      // Create sale record
      const sale = await createSale({ totalAmount: total });
      
      // Create sales details for each cart item
      for (const item of cart) {
        await createSalesDetail({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        });
      }
      
      // Update cash register
      await updateCashRegister({ cashin: amount });
      
      setCart([]);
      setModalOpen(false);
      alert("Sale completed successfully!");
      
      // Reload inventory to update stock levels
      loadInventory();
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpesaCheckout = async (phone: string) => {
    if (!phone || !total) return alert("Phone number and total amount are required");
    if (isNaN(total) || total <= 0) return alert("Total amount must be a valid number greater than zero");
    
    try {
      setIsLoading(true);
      
      // For now, simulate M-Pesa payment
      // In a real implementation, you would integrate with M-Pesa API
      
      // Create sale record
      const sale = await createSale({ totalAmount: total });
      
      // Create sales details for each cart item
      for (const item of cart) {
        await createSalesDetail({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        });
      }
      
      setCart([]);
      setModalOpen(false);
      alert("M-Pesa payment completed successfully!");
      
      // Reload inventory to update stock levels
      loadInventory();
    } catch (error) {
      console.error("M-Pesa payment failed:", error);
      alert("M-Pesa payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setProducts([]);
      return;
    }
    
    try {
      const results = await searchProducts(query);
      setProducts(results);
    } catch (error) {
      console.error("Search failed:", error);
      setProducts([]);
    }
  };

  const handleAddFromSearch = (product: any) => {
    addToCart(product);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const productData = {
        barcode: newProduct.barcode,
        name: newProduct.name,
        description: newProduct.description || undefined,
        price: parseFloat(newProduct.price),
        stock: newProduct.stock ? parseInt(newProduct.stock) : undefined,
        minStock: newProduct.minStock ? parseInt(newProduct.minStock) : undefined,
        categoryId: newProduct.categoryId ? parseInt(newProduct.categoryId) : undefined,
      };
      
      const added = await createProduct(productData);
      setInventory(prev => [...prev, added]);
      setNewProduct({ 
        name: '', 
        price: '', 
        barcode: '', 
        description: '',
        stock: '',
        minStock: '',
        categoryId: ''
      });
      alert("Product added successfully!");
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = '/pages/login';
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout even if API call fails
      window.location.href = '/pages/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-charcoal via-slate-grey to-light-grey relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-grey rounded-xl p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon"></div>
            <span className="text-off-white font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="fixed top-0 left-20 right-0 bg-slate-grey/95 backdrop-blur-xl border-b border-light-grey/20 z-30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-off-white">Cashier Terminal</h1>
            <p className="text-sm text-warm-grey">Welcome, {user?.username}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-warm-grey">
              <User size={16} />
              <span>{user?.role?.toUpperCase()}</span>
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

      {/* Sidebar */}
      <SideBar
        onShowInventory={() => setShowInventory(true)}
        onShowCart={() => setShowCart(true)}
        onCheckout={() => setModalOpen(true)}
      />

      {/* Inventory Sidebar */}
      <div className={`
        fixed left-20 top-0 h-full w-96 bg-slate-grey/95 backdrop-blur-xl border-r border-light-grey/20 
        shadow-2xl transition-transform duration-300 z-40 flex flex-col
        ${showInventory ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-light-grey/20 mt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-maroon/20 rounded-lg">
                <Package className="w-6 h-6 text-maroon" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-off-white">Inventory Manager</h2>
                <p className="text-sm text-warm-grey">Manage products & stock</p>
              </div>
            </div>
            <button
              onClick={() => setShowInventory(false)}
              className="p-2 hover:bg-light-grey/20 rounded-lg transition-colors duration-200 text-warm-grey hover:text-off-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-light-grey/20">
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-warm-grey mb-2">Product Name</label>
              <input 
                className="input" 
                placeholder="Enter product name" 
                value={newProduct.name} 
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-grey mb-2">Barcode</label>
              <input 
                className="input" 
                placeholder="Enter barcode" 
                value={newProduct.barcode} 
                onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-grey mb-2">Price</label>
              <input 
                className="input" 
                placeholder="0.00" 
                type="number" 
                step="0.01"
                value={newProduct.price} 
                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-grey mb-2">Stock Quantity</label>
              <input 
                className="input" 
                placeholder="0" 
                type="number"
                value={newProduct.stock} 
                onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} 
              />
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </form>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="font-semibold text-off-white mb-4 flex items-center space-x-2">
            <Package size={18} />
            <span>Products ({inventory.length})</span>
          </h3>
          <div className="space-y-2">
            {inventory.map((item, idx) => (
              <div key={item.id || idx} className="card p-4 hover:bg-light-grey/20 transition-colors duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-off-white">{item.name}</p>
                    <p className="text-sm text-warm-grey">${item.price}</p>
                    {item.stock !== undefined && (
                      <p className="text-xs text-warm-grey">Stock: {item.stock}</p>
                    )}
                  </div>
                  <button 
                    className="btn-primary text-sm px-3 py-1"
                    onClick={() => addToCart(item)}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      {showCart && (
        <div className="fixed right-0 top-0 h-full w-96 bg-slate-grey/95 backdrop-blur-xl border-l border-light-grey/20 shadow-2xl z-30 flex flex-col">
          <div className="p-6 border-b border-light-grey/20 mt-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-maroon/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-maroon" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-off-white">Current Sale</h2>
                  <p className="text-sm text-warm-grey">{cart.length} items</p>
                </div>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-light-grey/20 rounded-lg transition-colors duration-200 text-warm-grey hover:text-off-white lg:hidden"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Cart items={cart} onQuantityChange={handleQuantityChange} onRemove={handleRemove} />
          </div>

          <div className="p-6 border-t border-light-grey/20 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-warm-grey">Total:</span>
              <span className="text-maroon">${total.toFixed(2)}</span>
            </div>
            <button
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setModalOpen(true)}
              disabled={cart.length === 0}
            >
              Checkout ({cart.length} items)
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`
        transition-all duration-300 p-6 space-y-6 pt-24
        ${showCart ? 'ml-20 mr-96' : 'ml-20 mr-0'}
        ${showInventory ? 'ml-[26rem]' : ''}
      `}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search Bar */}
          <div className="card">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Product List */}
          {products.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-off-white mb-4">
                Search Results for "{searchQuery}"
              </h3>
              <ProductList products={products} onAddToCart={handleAddFromSearch} />
            </div>
          )}

          {/* Scanner Input */}
          <div className="card">
            <ScannerInput onScan={handleScan} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowInventory(true)}
              className="card hover:bg-light-grey/20 transition-colors duration-200 flex items-center space-x-4 p-6"
            >
              <Package className="w-8 h-8 text-maroon" />
              <div className="text-left">
                <h3 className="font-semibold text-off-white">Manage Inventory</h3>
                <p className="text-sm text-warm-grey">Add, edit, or remove products</p>
              </div>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              disabled={cart.length === 0}
              className="card hover:bg-light-grey/20 transition-colors duration-200 flex items-center space-x-4 p-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Smartphone className="w-8 h-8 text-maroon" />
              <div className="text-left">
                <h3 className="font-semibold text-off-white">Process Payment</h3>
                <p className="text-sm text-warm-grey">Cash or M-Pesa checkout</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        total={total}
        onCashCheckout={handleCashCheckout}
        onMpesaCheckout={handleMpesaCheckout}
        onMpesaManual={() => {}} // Not implemented in this version
      />
    </div>
  );
};

export default CashierPage;

