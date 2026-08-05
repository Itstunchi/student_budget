import { useEffect, useMemo, useState } from "react";
import "../styles/Bills.css";

import Sidebar from "../components/Sidebar";
import AddBillModal from "../components/AddBillModal";

import { auth } from "../firebase/firebase";
import { getBills, deleteBill, markBillAsPaid, } from "../services/billService";

import {
  Search,
  Bell,
  Plus,
  Filter,
  ChevronDown,
  Receipt,
  Tv,
  Wifi,
  Zap,
  GraduationCap,
  Home,
  Droplets,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  AlertTriangle,
  BellRing,
  CheckCircle2,
} from "lucide-react";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("All");

  const [sort, setSort] = useState("Newest");

  const [showModal, setShowModal] = useState(false);

  const [editingBill, setEditingBill] = useState(null);

  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const data = await getBills(user.uid);

      setBills(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setShowModal(true);
  };

  const handleDelete = async (billId) => {
  const user = auth.currentUser;

  if (!user) return;

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this bill?"
  );

  if (!confirmDelete) return;

  try {
    await deleteBill(user.uid, billId);

    loadBills();
  } catch (error) {
    console.error(error);
    alert("Failed to delete bill.");
  }
};

const handleMarkAsPaid = async (billId) => {
  const user = auth.currentUser;

  if (!user) return;

  try {
    await markBillAsPaid(user.uid, billId);

    loadBills();
  } catch (error) {
    console.error(error);
    alert("Unable to update bill.");
  }
};

  const filteredBills = useMemo(() => {
    let data = [...bills];

    if (search) {
      data = data.filter(
        (bill) =>
          bill.title
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          bill.category
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    if (filter !== "All") {
      data = data.filter(
        (bill) => bill.category === filter
      );
    }

    if (sort === "Highest") {
      data.sort((a, b) => b.amount - a.amount);
    }

    if (sort === "Lowest") {
      data.sort((a, b) => a.amount - b.amount);
    }

    if (sort === "Newest") {
      data.sort(
        (a, b) =>
          new Date(b.dueDate) -
          new Date(a.dueDate)
      );
    }

    return data;
  }, [bills, search, filter, sort]);

  const totalBills = bills.length;

  const totalAmount = bills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const categories = [
    "All",
    ...new Set(
      bills.map((bill) => bill.category)
    ),
  ];

  const getIcon = (category) => {
  switch (category) {
    case "Entertainment":
      return <Tv size={22} />;
    case "Internet":
      return <Wifi size={22} />;
    case "Electricity":
      return <Zap size={22} />;
    case "Education":
      return <GraduationCap size={22} />;
    case "Rent":
      return <Home size={22} />;
    case "Water":
      return <Droplets size={22} />;
    default:
      return <Receipt size={22} />;
  }
};

const getStatus = (bill) => {
  if (bill.status === "Paid") return "Paid";

  const today = new Date();
  const due = new Date(bill.dueDate);

  if (due < today) return "Overdue";

  const diff = Math.ceil(
    (due - today) / (1000 * 60 * 60 * 24)
  );

  if (diff <= 3) return "Due Soon";

  return "Upcoming";
};

const paidBills = bills.filter(
  bill => bill.status === "Paid"
).length;

const pendingBills = bills.filter(
  bill => bill.status !== "Paid"
).length;

const paidAmount = bills
  .filter(bill => bill.status === "Paid")
  .reduce((sum, bill) => sum + Number(bill.amount), 0);

const pendingAmount = bills
  .filter(bill => bill.status !== "Paid")
  .reduce((sum, bill) => sum + Number(bill.amount), 0);

const upcomingBills = [...bills]
  .filter((bill) => bill.status !== "Paid")
  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  .slice(0, 5);

const overdueBills = bills.filter((bill) => {
  if (bill.status === "Paid") return false;
  return new Date(bill.dueDate) < new Date();
}).length;

const paidPercentage =
  totalBills === 0
    ? 0
    : Math.round((paidBills / totalBills) * 100);

const pendingPercentage =
  totalBills === 0
    ? 0
    : 100 - paidPercentage;

const notifications = bills
  .filter((bill) => bill.status !== "Paid")
  .map((bill) => {
    const today = new Date();
    const due = new Date(bill.dueDate);

    const diff = Math.ceil(
      (due - today) / (1000 * 60 * 60 * 24)
    );

    if (diff < 0) {
      return {
        id: bill.id,
        type: "overdue",
        message: `${bill.title} is overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? "s" : ""}.`,
      };
    }

    if (diff === 0) {
      return {
        id: bill.id,
        type: "today",
        message: `${bill.title} is due today.`,
      };
    }

    if (diff <= 3) {
      return {
        id: bill.id,
        type: "soon",
        message: `${bill.title} is due in ${diff} day${diff > 1 ? "s" : ""}.`,
      };
    }

    return null;
  })
  .filter(Boolean);

  return (
    <div className="dashboard">

      <Sidebar />

      <main className="dashboard-content">

        <div className="bills-page">

          {/* HEADER */}

          <div className="bills-header">

            <div>

              <h1>Bills & Reminders</h1>

              <p>
                Track and manage your bills in one
                place.
              </p>

            </div>

            <div className="header-actions">

              <div className="notification-wrapper">

                <button
                  className="notification-btn"
                  onClick={() =>
                    setShowNotifications(!showNotifications)
                  }
                >
                  <Bell size={20} />

                  {notifications.length > 0 && (
                    <span className="notification-badge">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (

                  <div className="notification-dropdown">

                    <h4>Notifications</h4>

                    {notifications.length === 0 ? (

                      <div className="notification-empty">
                        <CheckCircle2 size={18} />
                        <span>All bills are up to date.</span>
                      </div>

                    ) : (

                      notifications.map((item) => (

                        <div
                          key={item.id}
                          className={`notification-list-item ${item.type}`}
                        >
                          <AlertTriangle size={16} />
                          <span>{item.message}</span>
                        </div>

                      ))

                    )}

                  </div>

                )}

              </div>

              <button
                className="add-btn"
                onClick={() =>
                  setShowModal(true)
                }
              >
                <Plus size={18} />
                Add New Bill
              </button>

            </div>

          </div>

          {/* SEARCH */}

          <div className="toolbar">

            <div className="search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search bills..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <div className="toolbar-right">

              <div className="select-box">

                <Filter size={16} />

                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value)
                  }
                >
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  ))}
                </select>

              </div>

              <div className="select-box">

                <ChevronDown size={16} />

                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value)
                  }
                >
                  <option>Newest</option>

                  <option>Highest</option>

                  <option>Lowest</option>

                </select>

              </div>

            </div>

          </div>

          {/* SUMMARY */}

          <div className="summary-grid">

            <div className="summary-card">

            <h3>Total Bills</h3>

            <h1>{totalBills}</h1>

            <p>
            {pendingBills} Pending
            </p>

            </div>

            <div className="summary-card">

            <h3>Total Amount</h3>

            <h1>
            ₦{totalAmount.toLocaleString()}
            </h1>

            <p>
            Overall Bills
            </p>

            </div>

            <div className="summary-card">

            <h3>Paid</h3>

            <h1>{paidBills}</h1>

            <p>
            ₦{paidAmount.toLocaleString()}
            </p>

            </div>

            <div className="summary-card">

            <h3>Pending</h3>

            <h1>{pendingBills}</h1>

            <p>
            ₦{pendingAmount.toLocaleString()}
            </p>

            </div>

          </div>

          <div className="stats-section">

            <div className="stats-card">

              <h3>Bill Statistics</h3>

              <div className="progress-group">

                <div className="progress-label">
                  <span>Paid Bills</span>
                  <span>{paidPercentage}%</span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill paid-fill"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>

              </div>

              <div className="progress-group">

                <div className="progress-label">
                  <span>Pending Bills</span>
                  <span>{pendingPercentage}%</span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill pending-fill"
                    style={{ width: `${pendingPercentage}%` }}
                  />
                </div>

              </div>

              <div className="stats-footer">

                <div>

                  <h2>{paidBills}</h2>

                  <p>Paid</p>

                </div>

                <div>

                  <h2>{pendingBills}</h2>

                  <p>Pending</p>

                </div>

                <div>

                  <h2>{overdueBills}</h2>

                  <p>Overdue</p>

                </div>

              </div>

            </div>

          </div>

          {/* BILL LIST */}

          <div className="bill-list">

            {loading ? (

              <div className="empty-card">
                Loading bills...
              </div>

            ) : filteredBills.length === 0 ? (

              <div className="empty-card">

                <Receipt size={55} />

                <h3>No Bills Found</h3>

                <p>
                  Click "Add New Bill" to
                  create your first bill.
                </p>

              </div>

            ) : (

              filteredBills.map((bill) => {

                const status = getStatus(bill);

                return (

                <div className="bill-card" key={bill.id}>

                <div className="bill-left">

                <div className="bill-icon">
                {getIcon(bill.category)}
                </div>

                <div>

                <h3>{bill.title}</h3>

                <p>{bill.category}</p>

                <small>
                Due: {bill.dueDate}
                </small>

                </div>

                </div>

                <div className="bill-middle">

                <h2>
                ₦{Number(bill.amount).toLocaleString()}
                </h2>

                <span
                className={`status ${
                status.toLowerCase().replace(" ","-")
                }`}
                >
                {status}
                </span>

                </div>

                <div className="bill-actions">

                <button
                  onClick={() => handleEdit(bill)}
                >
                  <Pencil size={18}/>
                </button>

                <button
                  onClick={() => handleDelete(bill.id)}
                >
                  <Trash2 size={18} />
                </button>

                <button
                    onClick={() => handleMarkAsPaid(bill.id)}
                >
                    <CheckCircle size={18}/>
                </button>

                </div>

                </div>

                );

                })

            )}

          </div>

          <div className="reminders-card">

            <div className="reminders-header">

              <h2>Upcoming Reminders</h2>

              <span>{upcomingBills.length} Bills</span>

            </div>

            {upcomingBills.length === 0 ? (

              <div className="no-reminders">

                <Receipt size={45} />

                <p>No upcoming reminders.</p>

              </div>

            ) : (

              upcomingBills.map((bill) => (

                <div
                  key={bill.id}
                  className="reminder-item"
                >

                  <div className="reminder-left">

                    <div className="reminder-icon">
                      {getIcon(bill.category)}
                    </div>

                    <div>

                      <h4>{bill.title}</h4>

                      <small>{bill.category}</small>

                    </div>

                  </div>

                  <div className="reminder-right">

                    <strong>
                      ₦{Number(bill.amount).toLocaleString()}
                    </strong>

                    <span>{bill.dueDate}</span>

                  </div>

                </div>

              ))

            )}

          </div>

          <AddBillModal
            isOpen={showModal}
            editBill={editingBill}
            onSaved={()=>{
            setEditingBill(null);
            loadBills();
            }}
            onClose={()=>{
            setEditingBill(null);
            setShowModal(false);
            }}
          />

        </div>

      </main>

    </div>
  );
}