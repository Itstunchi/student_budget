import { FaShieldAlt } from "react-icons/fa";

export default function SecurityCard() {
  return (
    <div className="security-card">

      <div className="security-icon">
        <FaShieldAlt />
      </div>

      <div className="security-content">

        <h3>Your Security is Our Priority</h3>

        <p>
          Student Budget uses secure authentication and modern encryption
          practices to help protect your personal information and financial
          data. Always keep your password private and enable extra security
          features when available.
        </p>

      </div>

    </div>
  );
}