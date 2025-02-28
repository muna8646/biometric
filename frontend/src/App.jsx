import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import AgentDashboard from "./AgentDashboard";

function MainApp() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/agent-dashboard" element={<AgentDashboard />} />
    </Routes>
  );
}

export default MainApp;
