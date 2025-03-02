import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Home,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  Search,
  Trash,
  Edit,
  Printer,
} from "lucide-react";
import "./AdminDashboard.css";

const AdminDashboardLayout = () => {
  const [activeComponent, setActiveComponent] = useState("Dashboard");
  const [openMenu, setOpenMenu] = useState(null);
  const [agents, setAgents] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [stockData, setStockData] = useState({ product_name: "", quantity: "", price: "" });
  const [editingStock, setEditingStock] = useState(null);
  const [agentData, setAgentData] = useState({
    name: "",
    email: "",
    nationalId: "",
    password: "",
    biometricData: "",
  });
  const [agentCount, setAgentCount] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [editingAgent, setEditingAgent] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate
    
  // Function to handle logout
  const handleLogout = () => {
    // Perform any logout logic here (e.g., clearing local storage)
    navigate("/"); // Redirect to the home page
  };

  useEffect(() => {
    fetchData();
  }, [activeComponent]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeComponent === "ManageAgents") await fetchAgents();
      else if (activeComponent === "ManageStocks") await fetchStocks();
      else if (activeComponent === "Dashboard") {
        await fetchAgents();
        await fetchStocks();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const response = await fetch("http://localhost:5000/agents");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setAgents(data);
      setAgentCount(data.length);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
      alert("Failed to fetch agents: " + error.message);
    }
  };

  // Fetch stock
  const fetchStocks = async () => {
    try {
      const response = await fetch("http://localhost:5000/stock");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setStocks(data);
      setStockCount(data.length);
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
      alert("Failed to fetch stocks: " + error.message);
    }
  };

  // Handle stock input changes
  const handleStockInputChange = (e) => {
    setStockData({ ...stockData, [e.target.name]: e.target.value });
  };

  // Add or update stock
  const handleAddOrUpdateStock = async (e) => {
    e.preventDefault();
    try {
      const url = editingStock
        ? `http://localhost:5000/stock/${editingStock.id}`
        : "http://localhost:5000/stock";
      const method = editingStock ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      setStockData({ product_name: "", quantity: "", price: "" });
      setEditingStock(null);
      fetchStocks();
    } catch (error) {
      console.error("Error saving stock:", error);
      alert("Error saving stock: " + error.message);
    }
  };

  // Delete stock
  const handleDeleteStock = async (id) => {
    if (!window.confirm("Are you sure you want to delete this stock item?")) return;
    try {
      const response = await fetch(`http://localhost:5000/stock/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      fetchStocks();
    } catch (error) {
      console.error("Error deleting stock:", error);
      alert("Error deleting stock: " + error.message);
    }
  };

  // Start editing stock
  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setStockData({ product_name: stock.product_name, quantity: stock.quantity, price: stock.price });
  };

  // Handle agent input changes
  const handleInputChange = (e) => {
    setAgentData({ ...agentData, [e.target.name]: e.target.value, password: agentData.nationalId });
  };

  // Register or update agent
  const handleRegisterOrUpdateAgent = async (e) => {
    e.preventDefault();
    try {
      const url = editingAgent
        ? `http://localhost:5000/agents/${editingAgent.id}`
        : "http://localhost:5000/register";
      const method = editingAgent ? "PUT" : "POST";
      const agentDataToSend = { ...agentData, role: "agent" };
      if (editingAgent) {
        // Ensure password matches nationalId when editing
        agentDataToSend.password = agentData.nationalId;
      }
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentDataToSend),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      setAgentData({ name: "", email: "", nationalId: "", password: "" });
      setEditingAgent(null);
      fetchAgents();
    } catch (error) {
      console.error("Error saving agent:", error);
      alert("Error saving agent: " + error.message);
    }
  };

  // Delete agent
  const handleDeleteAgent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;
    try {
      const response = await fetch(`http://localhost:5000/agents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      await fetchAgents(); // Refresh agents after deletion
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Error deleting agent: " + error.message);
    }
  };

  // Start editing agent
  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setAgentData({
      name: agent.name,
      email: agent.email,
      nationalId: agent.nationalId,
      password: agent.nationalId, // Set password to nationalId for editing
    });
  };

  // Render components based on active state
  const renderContent = () => {
    if (loading) return <div>Loading...</div>;

    switch (activeComponent) {
      case "Dashboard":
        return (
          <div>
            <h2>Dashboard Content</h2>
            <div className="analytics-container">
              <div className="analytics-card">
                <h3>Total Agents</h3>
                <p>{agentCount}</p>
              </div>
              <div className="analytics-card">
                <h3>Total Stocks</h3>
                <p>{stockCount}</p>
              </div>
            </div>
          </div>
        );

      case "RegisterAgent":
        return (
          <div>
            <h2>{editingAgent ? "Edit Agent" : "Register Agent"}</h2>
            <form className="form-container" onSubmit={handleRegisterOrUpdateAgent}>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                placeholder="Enter agent name"
                value={agentData.name}
                onChange={handleInputChange}
                required
              />
              <label>Email:</label>
              <input
                type="email"
                name="email"
                placeholder="Enter agent email"
                value={agentData.email}
                onChange={handleInputChange}
                required
              />
              <label>National ID:</label>
              <input
                type="text"
                name="nationalId"
                placeholder="Enter National ID"
                value={agentData.nationalId}
                onChange={handleInputChange}
                required
              />
              <button type="submit" className="btn">
                {editingAgent ? "Update Agent" : "Register"}
              </button>
            </form>
          </div>
        );

      case "ManageAgents":
        return (
          <div>
            <h2>Manage Agents</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>{agent.name}</td>
                    <td>{agent.email}</td>
                    <td>
                      <button onClick={() => handleEditAgent(agent)}>
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => handleDeleteAgent(agent.id)}>
                        <Trash size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "AddStock":
        return (
          <div>
            <h2>{editingStock ? "Edit Stock" : "Add Stock"}</h2>
            <form className="form-container" onSubmit={handleAddOrUpdateStock}>
              <label>Stock Name:</label>
              <input
                type="text"
                name="product_name"
                placeholder="Enter stock name"
                value={stockData.product_name}
                onChange={handleStockInputChange}
                required
              />
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                placeholder="Enter quantity"
                value={stockData.quantity}
                onChange={handleStockInputChange}
                required
              />
              <label>Price:</label>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={stockData.price}
                onChange={handleStockInputChange}
                required
              />
              <button type="submit" className="btn">
                {editingStock ? "Update Stock" : "Add Stock"}
              </button>
            </form>
          </div>
        );

      case "ManageStocks":
        return (
          <div>
            <h2>Manage Stocks</h2>
            <table>
              <thead>
                <tr>
                  <th>Stock Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.id}>
                    <td>{stock.product_name}</td>
                    <td>{stock.quantity}</td>
                    <td>${stock.price}</td>
                    <td>
                      <button onClick={() => handleEditStock(stock)}>
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => handleDeleteStock(stock.id)}>
                        <Trash size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Settings":
        return <h2>Settings Content</h2>;

      default:
        return <h2>Dashboard Content</h2>;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Admin Dashboard</h1>
        </div>
        <nav className="sidebar-menu">
          <span className="menu-item" onClick={() => setActiveComponent("Dashboard")}>
            <Home className="icon" size={18} /> Dashboard
          </span>
          <div className="menu-group">
            <span className="menu-group-title" onClick={() => toggleMenu("agents")}>
              <Users className="icon" size={18} />
              Agents
              <ChevronDown size={18} className={openMenu === "agents" ? "rotate" : ""} />
            </span>
            {openMenu === "agents" && (
              <div className="submenu">
                <span className="submenu-item" onClick={() => setActiveComponent("RegisterAgent")}>Register Agent</span>
                <span className="submenu-item" onClick={() => setActiveComponent("ManageAgents")}>Manage Agents</span>
              </div>
            )}
          </div>
          <div className="menu-group">
            <span className="menu-group-title" onClick={() => toggleMenu("stocks")}>
              <Package className="icon" size={18} />
              Stocks
              <ChevronDown size={18} className={openMenu === "stocks" ? "rotate" : ""} />
            </span>
            {openMenu === "stocks" && (
              <div className="submenu">
                <span className="submenu-item" onClick={() => setActiveComponent("AddStock")}>Add Stock</span>
                <span className="submenu-item" onClick={() => setActiveComponent("ManageStocks")}>Manage Stocks</span>
              </div>
            )}
          </div>
          <span className="menu-item" onClick={handleLogout}>
            <LogOut className="icon" size={18} />
            Logout
          </span>
        </nav>
      </aside>
      <div className="main-content">
        <header className="header">
          <div className="header-container">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input type="text" placeholder="Search..." className="search-input" />
            </div>
          </div>
        </header>
        <main className="page-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
