"use client";

import React from "react"
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useState } from "react"
import { HelpCategoryCard } from "../../../components/help/category-card"
import { HelpForm } from "../../../components/help/help-form"

export default function HelpLanding() {
  return (
    <div className="min-h-screen bg-[#050015] text-white">
      <section className="px-6 md:px-20 py-16">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">What do you need help with?</h1>
        <Input
          type="search"
          placeholder="Search"
          className="bg-[#1C1B45] text-white placeholder:text-gray-400 border-none focus:ring-0 mb-10"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-20">
          <HelpCategoryCard title="Technical Support" desc="Get assistance with login issues, app operations and connectivity problems." />
          <HelpCategoryCard title="Reporting and Safety" desc="Learn how to report and block users, and keep the community safe." />
          <HelpCategoryCard title="Product Usage" desc="Steps on how to help you make the most of Expair’s features." />
          <HelpCategoryCard title="Account Management" desc="Manage your settings, update your profile, and secure your account." />
          <HelpCategoryCard title="Getting Started" desc="Guides and tutorials to help new users quickly get up and running with Expair." />
          <HelpCategoryCard title="Policies and Legal" desc="Access information about privacy, security, and our terms of service." />
        </div>

        <HelpForm />
      </section>

    </div>
  )
}