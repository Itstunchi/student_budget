import { FaChevronRight } from "react-icons/fa";

export default function BudgetRuleRow({
  title,
  description
}) {
  return (
    <div className="budget-row">

      <div className="budget-left">

        <h4>{title}</h4>

        <p>{description}</p>

      </div>

      <FaChevronRight className="budget-arrow" />

    </div>
  );
}