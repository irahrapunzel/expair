"use client";

import React from "react";
import HelpLayout from "../../components/help/helplayout";

export default function AccountManagementPage() {
  return (
    <HelpLayout>
      <div className="space-y-10 pb-[116px]">
        {/* Title */}
        <h1 className="text-[31px] font-[700] mb-[20px] flex items-center gap-2">
          <img src="/assets/icons/account.png" alt="Icon" className="w-[32px] h-[32px]" />
           Account Management</h1>

        {/* Section: Changing Email or Username */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Changing Email or Username</h2>
          <p className="mb-4">
            To change your login credentials, visit <strong>Account Settings &gt; Edit Profile</strong>. A verification prompt will be sent to your new email address for confirmation.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> I need to update my email—how?<br />
              <strong>A:</strong> Go to Edit Profile in Account Settings.
            </li>
            <li>
              <strong>Q:</strong> Do I have to verify the new email?<br />
              <strong>A:</strong> Yes, for security reasons.
            </li>
          </ul>
        </div>

        {/* Section: Deleting Your Account */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Deleting Your Account</h2>
          <p className="mb-4">
            Deleting your account is permanent. You can do this under <strong>Account Settings &gt; Delete Account</strong>. All associated data will be erased from the system.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Can I restore a deleted account?<br />
              <strong>A:</strong> No, deletion is permanent.
            </li>
            <li>
              <strong>Q:</strong> What happens to my data after deletion?<br />
              <strong>A:</strong> All data will be securely removed from our servers.
            </li>
          </ul>
        </div>

        {/* Section: Unauthorized Access */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Unauthorized Access</h2>
          <p className="mb-4">
            If you suspect someone has accessed your account, immediately change your password and enable Two-Factor Authentication (2FA) via Security Settings.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> I think someone accessed my account. What now?<br />
              <strong>A:</strong> Change your password and enable 2FA.
            </li>
            <li>
              <strong>Q:</strong> How do I report unauthorized access?<br />
              <strong>A:</strong> Contact our Support team with incident details.
            </li>
          </ul>
        </div>

        {/* Section: Notification Preferences */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Notification Preferences</h2>
          <p className="mb-4">
            Control your email and app notifications from <strong>Settings &gt; Notifications</strong>. You can choose which types of alerts you receive and how frequently.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How can I stop getting too many emails?<br />
              <strong>A:</strong> Adjust your email frequency under Notification Settings.
            </li>
            <li>
              <strong>Q:</strong> Can I mute all alerts?<br />
              <strong>A:</strong> Yes, but we recommend keeping important alerts enabled.
            </li>
          </ul>
        </div>

        {/* Section: Login from New Devices */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Login from New Devices</h2>
          <p className="mb-4">
            When logging in from a new device, Expair may ask for identity confirmation via your registered email. This is to protect your account.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Why was I asked to verify my login?<br />
              <strong>A:</strong> It’s a safety feature when detecting new devices.
            </li>
            <li>
              <strong>Q:</strong> Can I disable this feature?<br />
              <strong>A:</strong> No, it is mandatory for account security.
            </li>
          </ul>
        </div>
      </div>
    </HelpLayout>
  );
}
