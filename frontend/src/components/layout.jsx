import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = ({ onLogout }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <Navbar onLogout={onLogout} />
      <main className="mt-20 px-4 pb-8 sm:px-8 lg:px-16">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
