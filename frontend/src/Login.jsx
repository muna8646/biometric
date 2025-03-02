import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css'; // Import the CSS file

const App = () => {
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  // Function to capture fingerprint using WebAuthn API
  const captureFingerprint = async () => {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Web Authentication API is not supported on this browser.');
      }

      setScanning(true);

      const publicKeyOptions = {
        challenge: new Uint8Array(32),
        userVerification: 'required',
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });

      setScanning(false);

      if (!credential) {
        throw new Error('Fingerprint authentication failed.');
      }

      return credential.response.authenticatorData;
    } catch (error) {
      setScanning(false);
      console.error('Fingerprint capture failed:', error);
      alert('Fingerprint login not supported on this device.');
      throw error;
    }
  };

  // Handle fingerprint login
  const handleFingerprintLogin = async () => {
    try {
      const fingerprintData = await captureFingerprint();
      const response = await axios.post('http://localhost:5000/login', {
        fingerprint: fingerprintData,
      });

      console.log("🛠 Role received from fingerprint login:", response.data.role);

      if (response.data.role?.trim().toLowerCase() === 'admin') {
        console.log("🔹 Navigating to Admin Dashboard");
        navigate('/admin-dashboard');
      } else {
        console.log("🔹 Navigating to Agent Dashboard");
        navigate('/agent-dashboard');
      }

      alert('Login successful');
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert('Login failed');
    }
  };

  // Handle email login
  const handleEmailLogin = async () => {
    try {
      console.log("🔹 Sending Login Request:", { email, nationalId });

      const response = await axios.post('http://localhost:5000/login', {
        email,
        password: nationalId, // Send National ID as password
      });

      console.log("✅ Login Success:", response.data);
      console.log("🛠 Role received from email login:", response.data.role);

      if (response.data.role?.trim().toLowerCase() === 'admin') {
        console.log("🔹 Navigating to Admin Dashboard");
        navigate('/admin-dashboard');
      } else {
        console.log("🔹 Navigating to Agent Dashboard");
        navigate('/agent-dashboard');
      }

      alert('Login successful');
    } catch (error) {
      console.error("❌ Login Error:", error.response?.data || error.message);
      alert('Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Agent Login</h1>

        {/* Fingerprint Login */}
        <div className="fingerprint-container" onClick={handleFingerprintLogin}>
          <span className="material-icons fingerprint-icon">fingerprint</span>
          <p>Place your finger to scan</p>
        </div>
        {scanning && <div className="scanner">Scanning...</div>}

        {/* Email & National ID Login */}
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input-group">
          <input
            type="password" // Treat National ID as a password field (masked)
            placeholder="National ID"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
        </div>
        <button onClick={handleEmailLogin} className="login-button">Login</button>

        {/* Contact Administrator */}
        <p className="contact-admin">
          Having issues? <a href="mailto:admin@example.com">Contact Administrator</a>
        </p>
      </div>
    </div>
  );
};

export default App;