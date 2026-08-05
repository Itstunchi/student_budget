import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { getTransactions } from "../services/transactionService";

export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    const user = auth.currentUser;

    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const data = await getTransactions(user.uid);

    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    loading,
    loadTransactions,
  };
}