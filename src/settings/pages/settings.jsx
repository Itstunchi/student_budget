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




import {
  FaUser,
  FaBell,
  FaLock,
  FaRobot,
  FaPalette,
  FaExclamationTriangle,
} from "react-icons/fa";

import { MdSavings } from "react-icons/md";




const user = {
  fullName: "Daniel",
  email: "danieledjang1@gmail.com",
  joinedAt: "April 13 2026",
  photo: "",
};









function Settings() { 


const [activeColor, setActiveColor] = useState("#6c3df4");


const [hasNotification, setHasNotification] = useState(false);

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


       

<ProfileCard user={user} />



        <div className="settings-grid">

  <Accordion
  icon={<FaUser />}
  title="Account Settings"
>
 <SettingRow
    label="Full Name"
    value="Daniel Edjang"
/>

<SettingRow
    label="Email Address"
    value="danieledjang1@gmail.com"
/>

<SettingRow
    label="Phone Number"
    value="+234 811 701 2465"
/>

<SettingRow
    label="Currency"
    value="NGN (₦)"
/>

<SettingRow
    label="Language"
    value="English"
/>

<SettingRow
    label="Password"
    value="••••••••"
/>

</Accordion>



<Accordion
   
    icon={<MdSavings />}
    title="Budget Rules"
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
icon={<FaBell />}
 title="Notification Settings">

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

icon={<FaLock />}
title="Data & Privacy">

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

icon={<FaRobot />}
  title="AI Advisor Preferences">

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




<Accordion
  icon={<FaExclamationTriangle className="danger-icon" />}
  title="Danger Zone"
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





<Accordion 

icon={<FaPalette />}
 title="Appearance">









    <AppearanceSettings />

</Accordion>








<SecurityCard />



</div>

      </div>
    </div>







  );
}

export default Settings;