import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./Dashboard";
import Reports from "./pages/Reports"
import BudgetAdvisor from "./components/BudgetAdvisor";

  function App() {
      return (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/budgetadvisor" element={<BudgetAdvisor />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      );
    }

    export default App;   