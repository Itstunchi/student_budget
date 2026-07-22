import {
  FaChevronDown
} from "react-icons/fa";

import { useState } from "react";

function Accordion({ icon, title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="accordion">

      <button
        className="accordion-header"
        onClick={() => setOpen(!open)}
      >
        <div className="accordion-left">

          <div className="accordion-icon">
            {icon}
          </div>

          <span className="accordion-title">
            {title}
          </span>

        </div>


        <FaChevronDown
  className={`arrow ${open ? "rotate" : ""}`}
/>

      </button>

      {open && (
        <div className="accordion-body">
          {children}
        </div>
      )}

    </div>
  );
}

export default Accordion;