import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./Dashboard";
import Reports from "./pages/Reports"
import BudgetAdvisor from "./components/BudgetAdvisor";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";

  function App() {
      return (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/loading-screen" element={<LoadingScreen />} />
          <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
          <Route path="/budgetadvisor" element={<BudgetAdvisor />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      );
    }

    export default App;   