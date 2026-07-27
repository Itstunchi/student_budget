import { useState, useEffect } from "react";








import "../styles/settings.css";

import SettingRow from "../components/SettingRow";

import Accordion from "../components/Accordion";

import ProfileCard from "../components/ProfileCard";

import BudgetRuleRow from "../components/BudgetRuleRow";

import ToggleRow from "../components/ToggleRow";

import InfoRow from "../components/InfoRow";

import CacheRow from "../components/CacheRow";

import AppearanceSettings from "../components/AppearanceSettings";

import DangerRow from "../components/DangerRow";

import SecurityCard from "../components/SecurityCard";


import EditProfileModal from "../components/EditProfileModal";




import {
  FaUser,
  FaBell,
  FaLock,
  FaRobot,
  FaPalette,
  FaExclamationTriangle,
} from "react-icons/fa";

import { MdSavings } from "react-icons/md";














function Settings() { 


const [activeColor, setActiveColor] = useState("#6c3df4");


const [hasNotification, setHasNotification] = useState(false);




const [user, setUser] = useState({
  fullName: "Daniel Edjang",
  email: "danieledjang1@gmail.com",
  phone: "+234 811 701 2465",
  currency: "NGN (₦)",
  language: "English",
  password: "••••••••",
  joinedAt: "April 13, 2026",
  photo: "",
});


const [isEditing, setIsEditing] = useState(false);


const [openAccordion, setOpenAccordion] = useState(null);




useEffect(() => {
  document.documentElement.style.setProperty(
    "--primary-color",
    activeColor
  );
}, [activeColor]);






  return (

    

    <div className="settings-page">
      <div className="settings-container">

        {/* Header */}
        <header className="settings-header">
          <div>
            <h1>Settings & Profile</h1>
            <p>Manage your account, preferences and budget rules.</p>


            


          </div>


          

        


          <div className="header-actions">

 


  <button className="notification-btn">

  <FaBell />

  {hasNotification && (
    <span className="notification-badge"></span>
  )}

</button>





  <button className="advisor-btn">
    Ask Advisor
  </button>

</div>



        </header>


       




<ProfileCard
  user={user}
  setIsEditing={setIsEditing}
/>



        <div className="settings-grid">

          <div className="settings-column">

  

<Accordion
  icon={<FaUser />}
  title="Account Settings"
  isOpen={openAccordion === "account"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "account" ? null : "account"
    )
  }
>
 

<SettingRow
    label="Full Name"
    value={user.fullName}
/>



<SettingRow
    label="Email Address"
    value={user.email}
/>



<SettingRow
    label="Phone Number"
    value={user.phone}
/>



<SettingRow
    label="Currency"
    value={user.currency}
/>



<SettingRow
    label="Language"
    value={user.language}
/>



<SettingRow
    label="Password"
    value={user.password}
/>

</Accordion>







 <Accordion
  icon={<FaBell />}
  title="Notification Settings"
  isOpen={openAccordion === "notification"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "notification" ? null : "notification"
    )
  }
>

  <ToggleRow
    title="Budget Alerts"
    description="Receive alerts when you exceed your budget."
    defaultOn={true}
  />

  <ToggleRow
    title="Bill Reminders"
    description="Get reminded before your bills are due."
    defaultOn={true}
  />

  <ToggleRow
    title="Savings Updates"
    description="Receive updates about your savings progress."
    defaultOn={false}
  />

  <ToggleRow
    title="Weekly Summary"
    description="Get a weekly spending summary every Sunday."
    defaultOn={true}
  />

  <ToggleRow
    title="Marketing Tips"
    description="Receive budgeting tips and product updates."
    defaultOn={false}
  />

</Accordion>






  <Accordion
  icon={<FaRobot />}
  title="AI Advisor Preferences"
  isOpen={openAccordion === "ai"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "ai" ? null : "ai"
    )
  }
>

  <ToggleRow
    title="Personalized Recommendations"
    description="Receive AI suggestions based on your spending habits."
    defaultOn={true}
  />

  <ToggleRow
    title="Proactive Tips"
    description="Get smart budgeting tips before you overspend."
    defaultOn={true}
  />

  <ToggleRow
    title="Goal Suggestions"
    description="Allow AI to recommend realistic savings goals."
    defaultOn={true}
  />

  <ToggleRow
    title="Advisor Personality"
    description="Choose how your AI advisor communicates with you."
    defaultOn={false}
  />

</Accordion>












 {/* <Accordion
  icon={<FaRobot />}
  title="AI Advisor Preferences"
  isOpen={openAccordion === "ai"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "ai" ? null : "ai"
    )
  }
> */}




<Accordion
  icon={<FaPalette />}
  title="Appearance"
  isOpen={openAccordion === "appearance"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "appearance"
        ? null
        : "appearance"
    )
  }
>









    <AppearanceSettings />

</Accordion>














</div>


<div className="settings-column">




<Accordion
  icon={<MdSavings />}
  title="Budget Rules"
  isOpen={openAccordion === "budget"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "budget" ? null : "budget"
    )
  }
>

    <BudgetRuleRow
        title="Spending Limits"
        description="Set limits for categories"
    />

    <BudgetRuleRow
        title="Auto-Save Rules"
        description="Automatically save a portion of income"
    />

    <BudgetRuleRow
        title="Overspending Alerts"
        description="Choose when to be alerted"
    />

    <BudgetRuleRow
        title="Safe-to-Spend"
        description="Customize your safe-to-spend calculation"
    />

</Accordion>








<Accordion
  icon={<FaLock />}
  title="Data & Privacy"
  isOpen={openAccordion === "privacy"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "privacy" ? null : "privacy"
    )
  }
>

  <InfoRow
    title="Privacy Settings"
    description="Manage who can view your information."
  />

  <InfoRow
    title="Download My Data"
    description="Export your budgeting history and account data."
  />

 

  <CacheRow />

</Accordion>







<Accordion
  icon={<FaExclamationTriangle className="danger-icon" />}
  title="Danger Zone"
  isOpen={openAccordion === "danger"}
  onToggle={() =>
    setOpenAccordion(
      openAccordion === "danger"
        ? null
        : "danger"
    )
  }
>

    <DangerRow
        title="Reset Application"
        description="Reset all settings and preferences to their default values."
        buttonText="Reset"
        buttonClass="reset-btn"
        onClick={() => window.confirm("Reset application settings?")}
    />

    <DangerRow
        title="Delete Account"
        description="Permanently delete your Student Budget account and all associated data."
        buttonText="Delete"
        buttonClass="delete-btn"
        onClick={() => window.confirm("Delete this account permanently?")}
    />

</Accordion>


</div>






 









<div className="settings-footer">
    <SecurityCard />
</div>





{isEditing && (
  <EditProfileModal
    user={user}
    setUser={setUser}
    setIsEditing={setIsEditing}
  />
)}



</div>

      </div>


     



    </div>










  );
}

export default Settings;