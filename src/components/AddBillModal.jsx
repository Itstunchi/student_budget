import { useState, useEffect } from "react";
import "./AddBillModal.css";
import { auth } from "../firebase/firebase";
import { addBill, updateBill, } from "../services/billService";

function AddBillModal({ isOpen, onClose, onSaved, editBill, }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    dueDate: "",
    category: "General",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editBill) {
      setFormData({
        title: editBill.title,
        amount: editBill.amount,
        dueDate: editBill.dueDate,
        category: editBill.category,
      });
    } else {
      setFormData({
        title: "",
        amount: "",
        dueDate: "",
        category: "General",
      });
    }
  }, [editBill]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) return;

    if (!formData.title || !formData.amount || !formData.dueDate) {
      alert("Please fill all fields.");
      return;
    }

    setSaving(true);

    try {

      if (editBill) {

        await updateBill(
          user.uid,
          editBill.id,
          {
            ...formData,
            amount:Number(formData.amount),
          }
        );

      } else {

        await addBill(user.uid,{
          ...formData,
          amount:Number(formData.amount),
        });

      }

      onSaved();
      onClose();

    } catch(err){

      console.log(err);

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bill-modal-overlay">
      <div className="bill-modal">

        <h2>
          {editBill ? "Edit Bill" : "Add New Bill"}
        </h2>

        <input
          name="title"
          placeholder="Bill Name"
          value={formData.title}
          onChange={handleChange}
        />

        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
        />

        <input
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleChange}
        />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
        >
          <option>General</option>
          <option>School</option>
          <option>Rent</option>
          <option>Subscription</option>
          <option>Transport</option>
          <option>Utilities</option>
        </select>

        <div className="modal-buttons">
          <button onClick={onClose}>
            Cancel
          </button>

          <button onClick={handleSave}>
            {saving
            ? "Saving..."
            : editBill
            ? "Update Bill"
            : "Save Bill"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddBillModal;