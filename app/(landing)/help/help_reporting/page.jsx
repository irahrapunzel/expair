"use client";

import React from "react";
import HelpLayout from "../../../../components/help/helplayout";

export default function ReportingSafetyPage() {
  return (
    <HelpLayout>
      <div className="space-y-10 pb-[116px]">
        {/* Title */}
        <h1 className="text-[31px] font-[700] mb-[20px] flex items-center gap-2">
          <img src="/assets/icons/reporting.png" alt="Icon" className="w-[32px] h-[32px]" />
           Reporting and Safety</h1>

        {/* Section: Reporting Inappropriate Behavior */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Reporting Inappropriate Behavior</h2>
          <p className="mb-4">
            If a user encounters inappropriate behavior or policy violations, they can report the user through the “Report” button available on their profile or next to the message. Users are asked to include details to assist moderators in investigation.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Where is the “Report” button located?<br />
              <strong>A:</strong> On a user’s profile or card.
            </li>
            <li>
              <strong>Q:</strong> What kind of behavior should be reported?<br />
              <strong>A:</strong> Anything violating community guidelines—harassment, spam, scams.
            </li>
          </ul>
        </div>

        {/* Section: Post-Report Process */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Post-Report Process</h2>
          <p className="mb-4">
            After submitting a report, our moderation team will review the case and determine whether action such as warning, suspension, or banning is warranted. All reports are kept confidential.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Will I be notified after reporting someone?<br />
              <strong>A:</strong> We’ll notify you via email and in-app if action has been taken.
            </li>
            <li>
              <strong>Q:</strong> Are reports anonymous?<br />
              <strong>A:</strong> Yes, your identity remains confidential.
            </li>
          </ul>
        </div>

        {/* Section: Blocking or Muting Users */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Blocking or Muting Users</h2>
          <p className="mb-4">
            Expair offers the ability to block or mute users directly from their profile page. Blocking prevents contact altogether, while muting removes their content from your feed without alerting them.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Can a blocked user see my profile?<br />
              <strong>A:</strong> No, blocked users cannot contact or view your updates.
            </li>
            <li>
              <strong>Q:</strong> What happens when I mute someone?<br />
              <strong>A:</strong> Their messages will no longer appear in your feed.
            </li>
          </ul>
        </div>

        {/* Section: Suspicious Activities */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Suspicious Activities</h2>
          <p className="mb-4">
            Users who encounter profiles that seem suspicious, spammy, or potentially fraudulent should report them immediately. Never share personal information or make off-platform arrangements.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How do I know if someone is a scammer?<br />
              <strong>A:</strong> Watch for suspicious requests, off-platform links, and incomplete profiles.
            </li>
            <li>
              <strong>Q:</strong> Should I share my contact info?<br />
              <strong>A:</strong> No—keep all conversations within Expair.
            </li>
          </ul>
        </div>

        {/* Section: Privacy Safeguards */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Privacy Safeguards</h2>
          <p className="mb-4">
            Expair maintains strict policies on data protection. All user reports are treated with confidentiality, and actions are based on policy and community guideline violations.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How does Expair handle my report?<br />
              <strong>A:</strong> Reports are reviewed by moderators and remain private.
            </li>
            <li>
              <strong>Q:</strong> Can I follow up on a report?<br />
              <strong>A:</strong> Yes, you may message support for updates.
            </li>
          </ul>
        </div>
      </div>
    </HelpLayout>
  );
}
