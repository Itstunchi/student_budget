import { FaChevronRight } from "react-icons/fa";

function SettingRow({ label, value }) {
  return (
    <div className="setting-row">
      <div className="setting-label">{label}</div>

      <div className="setting-value">{value}</div>

      <div className="setting-arrow">
        <FaChevronRight />
      </div>
    </div>
  );
}

export default SettingRow;