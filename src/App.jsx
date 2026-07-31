import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ActivityProvider } from "./pages/ActivityContext"; 
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
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import Layout from "./components/Layout";
import Report from "./pages/Reports";

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "108, 61, 244";
};

function App() {
  useEffect(() => {
    const applyTheme = () => {
      const savedColor = localStorage.getItem("primary_theme_color") || "#6c3df4";
      document.documentElement.style.setProperty("--primary-color", savedColor);
      document.documentElement.style.setProperty("--primary-color-rgb", hexToRgb(savedColor));
    };

    applyTheme();

    window.addEventListener("themeChange", applyTheme);
    window.addEventListener("storage", applyTheme);

    return () => {
      window.removeEventListener("themeChange", applyTheme);
      window.removeEventListener("storage", applyTheme);
    };
  }, []);

  return (
    <ActivityProvider>
      
      <Routes>
        {/* Standalone Pages without Sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/loading-screen" element={<LoadingScreen />} />
        <Route path="/settings" element={<Settings />} />

        {/* Protected App Pages inside Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/signup" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/advisor" element={<BudgetAdvisor />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/spending-plan" element={<SpendingPlanWizard />} />
          <Route path="/savings-plan" element={<SavingsPlan />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/reports" element={<Report />} />
        </Route>
      </Routes>
    </ActivityProvider>
  );
}

export default App;