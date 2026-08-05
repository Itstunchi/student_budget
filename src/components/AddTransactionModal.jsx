import { useState } from "react";
import "./AddTransactionModal.css";
import { auth } from "../firebase/firebase";
import { addTransaction } from "../services/transactionService";

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
  });

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) return;

    if (!form.title || !form.amount) {
      alert("Please fill all fields.");
      return;
    }

    setSaving(true);

    try {
      await addTransaction(user.uid, {
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
      });

      onSaved();

      setForm({
        title: "",
        amount: "",
        category: "Food",
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="transaction-overlay">
      <div className="transaction-modal">

        <h2>Add Transaction</h2>

        <input
          placeholder="Transaction Title"
          value={form.title}
          onChange={(e)=>
            setForm({...form,title:e.target.value})
          }
        />

        <input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e)=>
            setForm({...form,amount:e.target.value})
          }
        />

        <select
          value={form.category}
          onChange={(e)=>
            setForm({...form,category:e.target.value})
          }
        >
          <option>Food</option>
          <option>Transport</option>
          <option>School</option>
          <option>Shopping</option>
          <option>Entertainment</option>
          <option>Bills</option>
        </select>

        <div className="modal-actions">
          <button onClick={onClose}>
            Cancel
          </button>

          <button onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}