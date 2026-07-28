import "../styles/settings.css";

import SettingRow from "../components/SettingRow";

import Accordion from "../components/Accordion";

function Settings() {
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
            <button className="notification-btn">🔔</button>
            <button className="advisor-btn">Ask Advisor</button>
          </div>
        </header>

        {/* Profile Card */}
        <section className="profile-card">
          <div className="profile-left">
            <div className="profile-image"></div>

            <div>
              <h2>Malvin</h2>
              <span className="student-badge">Student</span>

              <p>malvin@student.com</p>
              <p>📅 Member since May 12, 2024</p>
            </div>
          </div>

          <button className="edit-btn">
            Edit Profile
          </button>
        </section>




        <div className="settings-grid">

  <Accordion
  icon="👤"
  title="Account Settings"
>
 <SettingRow
    label="Full Name"
    value="Malvin"
/>

<SettingRow
    label="Email Address"
    value="malvin@student.com"
/>

<SettingRow
    label="Phone Number"
    value="+234 801 234 5678"
/>

<SettingRow
    label="Currency"
    value="NGN (₦)"
/>

<SettingRow
    label="Language"
    value="English"
/>
</Accordion>

<Accordion icon="💰" title="Budget Rules">
  <p>Spending Limits</p>
  <p>Auto Save Rules</p>
  <p>Overspending Alerts</p>
  <p>Safe to Spend</p>
</Accordion>

<Accordion icon="🔔" title="Notification Settings">
  <p>Budget Alerts</p>
  <p>Bill Reminders</p>
  <p>Savings Updates</p>
  <p>Weekly Summary</p>
  <p>Marketing Tips</p>
</Accordion>

<Accordion icon="🔒" title="Data & Privacy">
  <p>Privacy Settings</p>
  <p>Download My Data</p>
  <p>Clear Cache</p>
</Accordion>

<Accordion icon="🤖" title="AI Advisor Preferences">
  <p>Personalized Recommendations</p>
  <p>Proactive Tips</p>
  <p>Goal Suggestions</p>
  <p>Advisor Personality</p>
</Accordion>


<Accordion icon="🎨" title="Appearance">
  <p>Theme</p>
  <p>Accent Color</p>
</Accordion>




<Accordion icon="⚠️" title="Danger Zone">
  <p>Reset App</p>
  <p>Delete Account</p>
</Accordion>



</div>

      </div>
    </div>







  );
}

export default Settings;