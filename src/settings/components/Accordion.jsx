import {
  FaChevronDown
} from "react-icons/fa";



function Accordion({
  icon,
  title,
  children,
  isOpen,
  onToggle,
}) {


  

  return (
    <div className="accordion">

      <button
        className="accordion-header"
        

        onClick={onToggle}
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
  

  className={`arrow ${isOpen ? "rotate" : ""}`}
/>

      </button>

      

      {isOpen && (
        <div className="accordion-body">
          {children}
        </div>
      )}

    </div>
  );
}

export default Accordion;