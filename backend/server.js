const express = require('express');
const mysql = require('mysql2/promise'); // Use promise-based MySQL2
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// **Database Connection Pool (Improved Performance)**
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Muna21/06058#',
    database: 'biometric_sales_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// **Helper function to execute SQL queries**
const query = async (sql, values = []) => {
    try {
        const [results] = await db.query(sql, values);
        return results;
    } catch (error) {
        console.error("🔥 Database Error:", error);
        throw error;
    }
};

// **🔹 Register Agent (Uses National ID as Password)**
app.post('/register', async (req, res) => {
    const { name, email, nationalId, role, biometricData } = req.body;

    try {
        const sql = `INSERT INTO agents (name, email, nationalId, role, biometric_data) VALUES (?, ?, ?, ?, ?)`;
        await query(sql, [name, email, nationalId, role, biometricData]);

        res.status(201).json({ message: 'Agent registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// **Login Using National ID as Password**
app.post('/login', async (req, res) => {
    const { email, password } = req.body; // 'password' is actually nationalId
    console.log("🔹 Login Attempt Received:", { email });

    try {
        const sql = `SELECT * FROM agents WHERE email = ? LIMIT 1`;
        const results = await query(sql, [email]);

        if (results.length === 0) {
            console.log("❌ User Not Found:", email);
            return res.status(401).json({ message: 'User  not found' });
        }

        const user = results[0];
        console.log("✅ User Found:", user);

        if (password !== user.nationalId) { 
            console.log("❌ National ID Mismatch");
            return res.status(401).json({ message: 'Invalid National ID' });
        }

        console.log("✅ Login Successful");

        res.json({ message: 'Login successful', role: user.role, agentId: user.id });
    } catch (error) {
        console.error("🔥 Login Error:", error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// **🔹 Get All Agents**
app.get("/agents", async (req, res) => {
    try {
        const agents = await query("SELECT * FROM agents WHERE role = 'agent'");
        res.json(agents);
    } catch (error) {
        res.status(500).json({ message: "❌ Server error" });
    }
});

// **🔹 Update Agent**
app.put('/agents/:id', async (req, res) => {
    const { name, email, nationalId, role } = req.body;
    const { id } = req.params;

    try {
        const hashedPassword = await bcrypt.hash(nationalId, 10);
        const sql = `UPDATE agents SET name = ?, email = ?, nationalId = ?, password = ?, role = ? WHERE id = ?`;
        await query(sql, [name, email, nationalId, hashedPassword, role, id]);

        res.json({ message: '✅ Agent updated successfully' });
    } catch (error) {
        res.status(500).json({ message: "❌ Update failed" });
    }
});

// **🔹 Delete Agent**
app.delete('/agents/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await query(`DELETE FROM agents WHERE id = ?`, [id]);
        res.json({ message: '✅ Agent deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "❌ Delete failed" });
    }
});

// **🔹 Add Stock**
app.post("/stock", async (req, res) => {
    const { product_name, quantity, price } = req.body;

    if (!product_name || !quantity || !price) {
        return res.status(400).json({ message: "❌ All fields are required" });
    }

    try {
        await query(`INSERT INTO stock (product_name, quantity, price) VALUES (?, ?, ?)`, [product_name, quantity, price]);
        res.status(201).json({ message: "✅ Stock added successfully" });
    } catch (error) {
        res.status(500).json({ message: "❌ Server error" });
    }
});

// **🔹 Get All Stock**
app.get("/stock", async (req, res) => {
    try {
        const stock = await query("SELECT * FROM stock");
        res.json(stock);
    } catch (error) {
        res.status(500).json({ message: "❌ Server error" });
    }
});

// **🔹 Update Stock**
app.put('/stock/:id', async (req, res) => {
    const { product_name, quantity, price } = req.body;
    const { id } = req.params;

    try {
        await query(`UPDATE stock SET product_name = ?, quantity = ?, price = ? WHERE id = ?`, [product_name, quantity, price, id]);
        res.json({ message: '✅ Stock updated successfully' });
    } catch (error) {
        res.status(500).json({ message: "❌ Update failed" });
    }
});

// **🔹 Sell Stock**
app.post('/sell', async (req, res) => {
  const { stock_id, quantity } = req.body; // Removed agent_id

  try {
      // Check if stock exists
      const [stock] = await db.query('SELECT * FROM stock WHERE id = ?', [stock_id]);
      if (stock.length === 0) return res.status(404).json({ error: "Stock not found" });

      // Ensure stock is available
      if (stock[0].quantity < quantity) {
          return res.status(400).json({ error: "Not enough stock available" });
      }

      // Record transaction
      const total_price = stock[0].price * quantity; // Calculate total price
      const transactionDate = new Date(); // Get current date

      await db.query('INSERT INTO transactions (stock_id, quantity, total_price, transaction_date) VALUES (?, ?, ?, ?)', 
          [stock_id, quantity, total_price, transactionDate]);

      // Update stock quantity
      await db.query('UPDATE stock SET quantity = quantity - ? WHERE id = ?', [quantity, stock_id]);

      res.status(200).json({ message: "Sale recorded successfully", transaction: { stock_id, quantity, total_price, transaction_date: transactionDate } });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
  }
});

// **🔹 Delete Stock**
app.delete('/stock/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await query(`DELETE FROM stock WHERE id = ?`, [id]);
        res.json({ message: '✅ Stock deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "❌ Delete failed" });
    }
});

// **🔹 Start Server**
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});