import "./savings.css";

import SummaryCards from "./components/SummaryCards";
import goals from "./data";

const Savings = () => {
  return (
    <div className="savings-page">

      {/* Header */}
      <header className="savings-header">
        <div>
          <h1>Savings Plan</h1>
          <p>Set goals, save consistently and achieve your dreams.</p>
        </div>

        <div className="header-actions">
          <button className="advisor-btn">
            Ask Advisor
          </button>

          <button className="goal-btn">
            + Create New Goal
          </button>
        </div>
      </header>

      {/* Summary Section */}

      <section className="summary-section">

    <SummaryCards goals={goals} />

</section>


      {/* <section className="summary-section">

      </section> */}



      {/* Main Content */}
      <section className="content-section">

        {/* Left Side */}
        <div className="left-column">

        </div>

        {/* Right Side */}
        <div className="right-column">

        </div>

      </section>

    </div>
  );
};

export default Savings;