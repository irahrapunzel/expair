"use client";

import React from "react";
import Navbar from "../../components/navbar";

export default function HomeLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}