import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { getBudget } from "../services/budgetService";
import { getTransactions } from "../services/transactionService";
import { getBills } from "../services/billService";

export default function useReports() {

  const [loading, setLoading] = useState(true);

  const [budget, setBudget] = useState(null);

  const [transactions, setTransactions] = useState([]);

  const [bills, setBills] = useState([]);

  useEffect(() => {

    loadData();

  }, []);

  async function loadData() {

    const user = auth.currentUser;

    if (!user) return;

    try {

      const [budgetData, transactionData, billData] =
      await Promise.all([

        getBudget(user.uid),

        getTransactions(user.uid),

        getBills(user.uid),

      ]);

      setBudget(budgetData);

      setTransactions(transactionData);

      setBills(billData);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  }

  return {

    loading,

    budget,

    transactions,

    bills,

  };
}