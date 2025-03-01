import React, { useState, useEffect, useRef } from 'react';
import { Home, Package, FileText, LogOut, Search } from 'lucide-react';
import axios from 'axios';
import './AgentDashboard.css';
import { useReactToPrint } from 'react-to-print';

const AgentDashboard = () => {
  // State Management
  const [activeComponent, setActiveComponent] = useState('Dashboard');
  const [stocks, setStocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newStock, setNewStock] = useState({ product_name: '', quantity: '', price: '' });
  const [sale, setSale] = useState({ stockId: '', quantity: '' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState(null); // Email from local storage
  const componentRef = useRef(); // Ref for printing

  // Fetch stock data
  const fetchStocks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/stock');
      setStocks(response.data);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to fetch stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new stock
  const handleAddStock = async (e) => {
    e.preventDefault();
    setError('');
    if (!newStock.product_name || !newStock.quantity || !newStock.price) {
      setError('Please enter stock name, quantity, and price.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/stock', newStock);
      if (response.status === 201) {
        setStocks([...stocks, { ...newStock, id: response.data.id }]);
        setNewStock({ product_name: '', quantity: '', price: '' });
        alert('Stock added successfully!');
      } else {
        setError(response.data?.message || 'Failed to add stock. Unexpected status code.');
      }
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to add stock.');
    }
  };

  // Handle making a sale
  const handleSale = async (e) => {
    e.preventDefault();
    setError('');

    if (!sale.stockId || !sale.quantity) {
      setError('Please select stock and enter quantity.');
      return;
    }

    const selectedStock = stocks.find(stock => stock.id === parseInt(sale.stockId));

    if (!selectedStock) {
      setError('Invalid stock selected.');
      return;
    }

    if (parseInt(sale.quantity) > selectedStock.quantity) {
      setError('Not enough stock available.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/sell', {
        stock_id: sale.stockId,
        quantity: parseInt(sale.quantity),
      });

      if (response.status === 200) {
        setTransactions([...transactions, response.data.transaction]);
        fetchStocks();
        fetchTransactions();
        setSale({ stockId: '', quantity: '' });
        alert('Sale successful!');
      } else {
        setError(response.data?.error || 'Failed to complete sale. Unexpected status code.');
      }
    } catch (err) {
      console.error('Error processing sale:', err);
      setError(err.response?.data?.error || 'Failed to complete sale.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('agentId');
    localStorage.removeItem('email');
    window.location.href = '/';
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Fetch email from local storage
  useEffect(() => {
    fetchStocks();
    fetchTransactions();

    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Render components dynamically
  const renderContent = () => {
    if (loading) return <h2>Loading...</h2>;

    const filteredStocks = stocks.filter(stock =>
      stock.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (activeComponent) {
      case 'Dashboard':
        return (
          <div>
            <h2>Agent Dashboard</h2>
            {email && <p>Logged in as: {email}</p>}
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
            <div ref={componentRef}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total Price</th>
                    <th>Remaining Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                      <td>{transaction.product_name}</td>
                      <td>{transaction.quantity}</td>
                      <td>{transaction.price}</td>
                      <td>{transaction.total_price}</td>
                      <td>{transaction.remaining_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handlePrint}>Print</button>
          </div>
        );
      case 'ManageStocks':
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

            <h3>Current Stock</h3>
            <div className="search-bar">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search Stock"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => (
                  <tr key={stock.id}>
                    <td>{stock.product_name}</td>
                    <td>{stock.quantity}</td>
                    <td>{stock.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'MakeSales':
        return (
          <div>
            <h2>Make Sales</h2>
            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSale} className="form-container">
              <select
                value={sale.stockId}
                onChange={(e) => setSale({ ...sale, stockId: e.target.value })}
              >
                <option value="">Select Stock</option>
                {stocks.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.product_name} (Quantity: {stock.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={sale.quantity}
                onChange={(e) => setSale({ ...sale, quantity: e.target.value })}
              />
              <button type="submit">Make Sale</button>
            </form>
          </div>
        );
      default:
        return <h2>Select a section</h2>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <ul>
          <li onClick={() => setActiveComponent('Dashboard')}>
            <Home /> Dashboard
          </li>
          <li onClick={() => setActiveComponent('ManageStocks')}>
            <Package /> Manage Stocks
          </li>
          <li onClick={() => setActiveComponent('MakeSales')}>
            <FileText /> Make Sales
          </li>
          <li onClick={handleLogout}>
            <LogOut /> Logout
          </li>
        </ul>
      </div>
      <div className="content">{renderContent()}</div>
    </div>
  );
};

export default AgentDashboard;
