import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./Dashboard";
import Advisor from "./pages/budgetAdvisor";
import Bills from "./pages/Bills";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* <Route part="/Dashboard" /> */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/advisor" element={<Advisor />} />
       <Route path="/bills" element={<Bills />} />
    </Routes>
  );
}

export default App;
