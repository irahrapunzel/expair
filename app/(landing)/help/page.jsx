"use client";

import React from "react";
import { HelpCategoryCard } from "../../../components/help/category-card";
import { HelpForm } from "../../../components/help/help-form";
import HelpLayout from "../../../components/help/helplayout";
import Link from "next/link";

export default function HelpLanding() {
  return (
    <HelpLayout>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-20">
        <HelpCategoryCard
          title="Technical Support"
          desc="Get assistance with login issues, app operations and connectivity problems."
          iconSrc="/assets/icons/techsupport.png"
          href="/help_technical"
          className="w-[300px] h-[255px]"
        />

        <HelpCategoryCard
          title="Reporting and Safety"
          desc="Learn how to report and block users, and keep the community safe."
          iconSrc="/assets/icons/reporting.png"
          href="/help_reporting"
          className="w-[300px] h-[255px]"
        />

        <HelpCategoryCard
          title="Product Usage"
          desc="Steps on how to help you make the most of Expair’s features."
          iconSrc="/assets/icons/product.png"
          href="/help_product"
          className="w-[300px] h-[255px]"
        />

        <HelpCategoryCard
          title="Account Management"
          desc="Manage your settings, update your profile, and secure your account."
          iconSrc="/assets/icons/account.png"
          href="/help_account"
          className="w-[300px] h-[255px]"
        />

        <HelpCategoryCard
          title="Getting Started"
          desc="Guides and tutorials to help new users quickly get up and running with Expair."
          iconSrc="/assets/icons/start.png"
          href="/help_tutorials"
          className="w-[300px] h-[255px]"
        />

        <HelpCategoryCard
          title="Policies and Legal"
          desc="Access information about privacy, security, and our terms of service."
          iconSrc="/assets/icons/policies.png"
          href="/help_policies"
          className="w-[300px] h-[255px]"
        />
      </div>

      {/* Help Form */}
      <HelpForm />
    </HelpLayout>
  );
}
