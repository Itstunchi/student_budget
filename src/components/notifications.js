// src/utils/notifications.js

export const getBillNotifications = () => {
  const saved = localStorage.getItem('user_bills');
  const bills = saved ? JSON.parse(saved) : [];

  const notifications = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  bills.forEach((bill) => {
    if (bill.status === 'Paid') return;

    const [year, month, day] = bill.dueDate.split('-').map(Number);
    const billDate = new Date(year, month - 1, day);
    billDate.setHours(0, 0, 0, 0);

    if (billDate.getTime() === today.getTime()) {
      notifications.push({
        id: `due-today-${bill.id}`,
        title: 'Bill Due Today! ⚠️',
        message: `${bill.name} (₦${bill.amount.toLocaleString()}) is due today.`,
        type: 'danger',
        date: 'Today',
      });
    } else if (billDate.getTime() === tomorrow.getTime()) {
      notifications.push({
        id: `due-tomorrow-${bill.id}`,
        title: 'Upcoming Bill Due Tomorrow ⏰',
        message: `${bill.name} (₦${bill.amount.toLocaleString()}) is due tomorrow.`,
        type: 'warning',
        date: 'Tomorrow',
      });
    }
  });

  return notifications;
};