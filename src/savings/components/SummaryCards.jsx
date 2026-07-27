const SummaryCards = ({ goals }) => {

  const totalSaved = goals.reduce(
    (total, goal) => total + goal.saved,
    0
  );

  const activeGoals = goals.length;

  const completion =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce(
            (total, goal) =>
              total + (goal.saved / goal.target) * 100,
            0
          ) / goals.length
        );

  return (

    <div className="summary-cards">

      <div className="summary-card">

        <h4>Total Saved</h4>

        <h2>
          ₦
          {totalSaved.toLocaleString()}
        </h2>

      </div>

      <div className="summary-card">

        <h4>Active Goals</h4>

        <h2>{activeGoals}</h2>

      </div>

      <div className="summary-card">

        <h4>Goal Completion</h4>

        <h2>{completion}%</h2>

      </div>

    </div>

  );
};

export default SummaryCards;