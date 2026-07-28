import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import BudgetAdvisor from "./components/BudgetAdvisor";
import Calendar from "./components/Calendar";
import SpendingPlanWizard from "./components/SpendingPlanWizard";
import SavingsPlan from "./components/SavingsPlan";
import Bills from "./pages/Bills";
import Settings from "./settings/pages/settings";
import Dashboard from "./pages/Dashboard";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/advisor" element={<BudgetAdvisor />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/spending-plan" element={<SpendingPlanWizard />} />
      <Route path="/savings-plan" element={<SavingsPlan />} />
       <Route path="/bills" element={<Bills />} />
      <Route path="/settings" element={<Settings />} />
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/loading-screen" element={<LoadingScreen />} />
    </Routes>
  );
}

    export default App;   