import { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { getBills } from "../services/billService";

export default function useBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBills = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setBills([]);
        return;
      }

      const data = await getBills(user.uid);
      setBills(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  return {
    bills,
    loading,
    loadBills,
  };
}