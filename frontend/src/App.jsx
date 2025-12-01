import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupForm from "./pages/SignupForm";   
import LoginForm from "./pages/login";
import VerifyEmailPage from "./pages/VerifyPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/Privateroutes";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import Profile from "./pages/profile";
import Connections from "./pages/connections"
function App() {
  const handleLogout = () => {
    localStorage.removeItem("token"); 
    window.location.href = "/login";
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SignupForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Private routes under layout */}
        <Route
          element={
            <PrivateRoute>
              <Layout onLogout={handleLogout} />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile/>}></Route>
          <Route path="/connections" element={<Connections />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
