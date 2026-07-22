import { FaChevronRight } from "react-icons/fa";

export default function InfoRow({
  title,
  description,
}) {
  return (
    <div className="info-row">

      <div className="info-left">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>

      <FaChevronRight className="info-arrow" />

    </div>
  );
}