import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import BudgetAdvisor from "./components/BudgetAdvisor";
import Calendar from "./components/Calendar";
import SpendingPlanWizard from "./components/SpendingPlanWizard";
import Bills from "./pages/Bills";
import Settings from "./settings/pages/settings";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen"
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<ProtectedRoute> <Signup /> </ProtectedRoute> } />
      <Route path="/forgot-password" element={<ProtectedRoute> <ForgotPassword /> </ProtectedRoute> } />
      <Route path="/advisor" element={<ProtectedRoute> <BudgetAdvisor /> </ProtectedRoute> } />
      <Route path="/calendar" element={<ProtectedRoute> <Calendar /> </ProtectedRoute> } />
      <Route path="/spending-plan" element={<ProtectedRoute> <SpendingPlanWizard /> </ProtectedRoute> } />
      <Route path="/bills" element={<ProtectedRoute> <Bills /> </ProtectedRoute> } />
      <Route path="/settings" element={<ProtectedRoute> <Settings /> </ProtectedRoute> } />
      <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
      <Route path="/reports" element={<ProtectedRoute> <Reports /> </ProtectedRoute> } />
      <Route path="/loading-screen" element={<ProtectedRoute> <LoadingScreen /> </ProtectedRoute> } />
    </Routes>
  );
}

    export default App;   