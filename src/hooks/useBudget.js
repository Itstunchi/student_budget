import { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { getBudget } from "../services/budgetService";

export default function useBudget() {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setLoading(false);
          return;
        }

        const data = await getBudget(user.uid);
        setBudget(data);
      } catch (error) {
        console.error("Error loading budget:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, []);

  return {
    budget,
    loading,
  };
}