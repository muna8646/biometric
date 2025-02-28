import React, { useState, useEffect } from "react";
import { Home, Package, FileText, LogOut, Search } from "lucide-react";
import axios from "axios";
import "./AdminDashboard.css";

const AgentDashboard = () => {
    const [activeComponent, setActiveComponent] = useState("Dashboard");
    const [stocks, setStocks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newStock, setNewStock] = useState({ product_name: "", quantity: "", price: "" });
    const [sale, setSale] = useState({ stockId: "", quantity: "" });
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [agentId, setAgentId] = useState(null); // Store agent ID

    useEffect(() => {
        fetchStocks();
        fetchTransactions();
        // Assuming agent ID is stored in local storage after login
        const storedAgentId = localStorage.getItem("agentId");
        if (storedAgentId) {
            setAgentId(storedAgentId);
        }
    }, []);

    /** Fetch stock data */
    const fetchStocks = async () => {
        setLoading(true);
        setError(""); // Clear any previous errors
        try {
            const response = await axios.get("http://localhost:5000/stock");
            setStocks(response.data);
        } catch (err) {
            console.error("Error fetching stocks:", err);
            setError("Failed to fetch stocks. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /** Fetch transactions */
    const fetchTransactions = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("http://localhost:5000/transactions");
            setTransactions(response.data);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError("Failed to fetch transactions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /** Handle adding new stock */
    const handleAddStock = async (e) => {
        e.preventDefault();
        setError("");
        if (!newStock.product_name || !newStock.quantity || !newStock.price) {
            setError("Please enter stock name, quantity, and price.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/stock", newStock);
            if (response.status === 201) { // Check for successful status
                setStocks([...stocks, { ...newStock, id: response.data.id }]); // Update UI immediately with the returned stock data
                setNewStock({ product_name: "", quantity: "", price: "" }); // Clear input
                alert("Stock added successfully!");
            } else {
                setError(response.data?.message || "Failed to add stock. Unexpected status code.");
            }
        } catch (err) {
            console.error("Error adding stock:", err);
            setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || "Failed to add stock.");
        }
    };

    /** Handle making a sale */
  /** Handle making a sale */
const handleSale = async (e) => {
  e.preventDefault();
  setError("");

  // Check if stockId and quantity are set
  if (!sale.stockId || !sale.quantity) {
      setError("Please select stock and enter quantity.");
      return;
  }

  // Ensure agentId is set
  if (!agentId) {
      setError("Agent ID is not set. Please log in again.");
      return;
  }

  const selectedStock = stocks.find(stock => stock.id === parseInt(sale.stockId));

  if (!selectedStock) {
      setError("Invalid stock selected.");
      return;
  }

  if (parseInt(sale.quantity) > selectedStock.quantity) {
      setError("Not enough stock available.");
      return;
  }

  try {
      const response = await axios.post("http://localhost:5000/sell", {
          stock_id: sale.stockId,
          agent_id: agentId, // Include agent ID in the request
          quantity: parseInt(sale.quantity),
      });

      if (response.status === 200) {
          setTransactions([...transactions, response.data.transaction]); // Update transactions with the returned transaction data
          fetchStocks(); // Refresh stock data
          setSale({ stockId: "", quantity: "" }); // Reset input
          alert("Sale successful!");
      } else {
          setError(response.data?.error || "Failed to complete sale. Unexpected status code.");
      }

  } catch (err) {
      console.error("Error processing sale:", err);
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Failed to complete sale.");
  }
};

    /** Handle logout */
    const handleLogout = () => {
        // Clear any user session or token here
        localStorage.removeItem("token"); // Example: Remove token from localStorage
        localStorage.removeItem("agentId"); // Remove agent ID from localStorage
        window.location.href = "/"; // Redirect to login page
    };

    /** Render components dynamically */
    const renderContent = () => {
        if (loading) return <h2>Loading...</h2>;

        // Filter stocks based on search term
        const filteredStocks = stocks.filter(stock =>
            stock.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        switch (activeComponent) {
            case "Dashboard":
                return (
                    <div>
                        <h2>Agent Dashboard</h2>
                        {error && <p className="error-message">{error}</p>}
                        <div className="analytics-container">
                            <div className="analytics-card">
                                <h3>Available Stocks</h3>
                                <p>{stocks.length}</p>
                            </div>
                            <div className="analytics-card">
                                <h3>My Transactions</h3>
                                <p>{transactions.length}</p>
                            </div>
                        </div>

                        <h3>Recent Transactions</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                                        <td>Sale</td>
                                        <td>${transaction.total_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case "ManageStocks":
                return (
                    <div>
                        <h2>Manage Stocks</h2>
                        {error && <p className="error-message">{error}</p>}

                        <form onSubmit={handleAddStock} className="form-container">
                            <input
                                type="text"
                                placeholder="Stock Name"
                                value={newStock.product_name}
                                onChange={(e) => setNewStock({ ...newStock, product_name: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={newStock.quantity}
                                onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={newStock.price}
                                onChange={(e) => setNewStock({ ...newStock, price: e.target.value })}
                            />
                            <button type="submit">Add Stock</button>
                        </form>

                        <table>
                            <thead>
                                <tr>
                                    <th>Stock Name</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStocks.map((stock) => (
                                    <tr key={stock.id}>
                                        <td>{stock.product_name}</td>
                                        <td>{stock.quantity}</td>
                                        <td>${stock.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case "Transactions":
                return (
                    <div>
                        <h2>Make a Sale</h2>
                        {error && <p className="error-message">{error}</p>}

                        <form onSubmit={handleSale} className="form-container">
                            <select
                                value={sale.stockId}
                                onChange={(e) => setSale({ ...sale, stockId: e.target.value })}
                            >
                                <option value="">Select Stock</option>
                                {stocks.map((stock) => (
                                    <option key={stock.id} value={stock.id}>
                                        {stock.product_name} (${stock.price} per unit)
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={sale.quantity}
                                onChange={(e) => setSale({ ...sale, quantity: e.target.value })}
                            />
                            <button type="submit">Sell</button>
                        </form>

                        <h2>Transactions</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                                        <td>Sale</td>
                                        <td>${transaction.total_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case "Settings":
                return <h2>Settings</h2>;

            default:
                return <h2>Dashboard</h2>;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">Agent Dashboard</div>
                <div className="navbar-search">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search Stocks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="navbar-profile">
                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut className="icon" size={18} /> Logout
                    </button>
                </div>
            </nav>

            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1>Agent Dashboard</h1>
                </div>
                <nav className="sidebar-menu">
                    <span className="menu-item" onClick={() => setActiveComponent("Dashboard")}>
                        <Home className="icon" size={18} /> Dashboard
                    </span>
                    <span className="menu-item" onClick={() => setActiveComponent("ManageStocks")}>
                        <Package className="icon" size={18} /> Stocks
                    </span>
                    <span className="menu-item" onClick={() => setActiveComponent("Transactions")}>
                        <FileText className="icon" size={18} /> Transactions
                    </span>
                </nav>
            </aside>
            <div className="main-content">
                <main className="page-content">{renderContent()}</main>
            </div>
        </div>
    );
};

export default AgentDashboard;