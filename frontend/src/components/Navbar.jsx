import React, { useState } from "react";
import { Menu, Bell, UserCircle, LogOut, X } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Profile", path: "/profile" },
  { label: "Connections", path: "/connections" },
  { label: "Chat", path: "/chat" },
  { label: "Recommendations", path: "/recommendations" },
  { label: "Subscription", path: "/subscription" },
];

const Navbar = ({ onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!");
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-[#30187d] shadow-lg shadow-indigo-900/20">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-full p-2 text-white transition hover:bg-white/10 md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/dashboard")}
              className="text-2xl font-semibold text-white"
            >
              <span className="text-indigo-200">Skill</span>Xchange
            </motion.button>
          </div>

          {/* Right: links + icons */}
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-full px-4 py-2 text-sm font-medium text-white transition ${
                    isActive(item.path)
                      ? "bg-white/25 shadow-sm"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* <button
              type="button"
              className="rounded-full p-2 text-white transition hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="rounded-full p-2 text-white transition hover:bg-white/10"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
            >
              <UserCircle className="h-6 w-6" />
            </button> */}

            <div className="hidden md:block">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative h-full w-72 bg-emerald-950 text-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-6">
              <span className="text-lg font-semibold text-emerald-100">
                Menu
              </span>
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-full p-1 hover:bg-white/10"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 px-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive(item.path)
                      ? "bg-white/20"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto px-4 pb-8 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
