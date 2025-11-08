import React, { useState } from "react";
import { Heart, User, Stethoscope, Pill, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !userType) {
      alert("Please enter both username and select your role.");
      return;
    }

    try {
      const { data: patient, error } = await supabase
        .from("patients")
        .select("*")
        .ilike("username", username.trim())
        .single();

      if (error || !patient) {
        alert("No such patient found. Please check username or sign up first.");
        return;
      }

      navigate("/dashboard", {
        state: { username, userType },
      });
    } catch (err) {
      alert("Error during login: " + err.message);
    }
  };

  const handleSignupClick = () => navigate("/signup");

  const userTypes = [
    { value: "patient", label: "Patient", icon: User },
    { value: "doctor", label: "Doctor", icon: Stethoscope },
    { value: "chemist", label: "Chemist", icon: Pill },
  ];

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-inner">
          <div className="logo-section">
            <Heart className="logo-icon" fill="currentColor" />
            <h1 className="logo-text">Mediconnect</h1>
          </div>
          <button className="signup-btn" onClick={handleSignupClick}>
            Sign Up
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* --- Intro Section --- */}
        <section className="intro-section">
          <p className="intro-text">
            Welcome to <strong>Mediconnect</strong> — a unified digital healthcare platform
            connecting <strong>patients</strong>, <strong>doctors</strong>, and <strong>chemists</strong>.
            Manage medical records, consultations, and prescriptions securely — all in one place.
          </p>
        </section>

        {/* --- Login Box --- */}
        <div className="login-box">
          <h3 className="login-title">Login to Your Account</h3>

          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="input-group">
            <label>Select Who You Are</label>
            <div className="dropdown">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="dropdown-btn"
              >
                {userType
                  ? userTypes.find((t) => t.value === userType)?.label
                  : "Choose your role"}
                <ChevronDown
                  className={`dropdown-icon ${dropdownOpen ? "open" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  {userTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          setUserType(type.value);
                          setDropdownOpen(false);
                        }}
                        className="dropdown-item"
                      >
                        <Icon className="dropdown-item-icon" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button onClick={handleLogin} className="login-btn">
            Login
          </button>

          <p className="signup-text">
            Don't have an account?{" "}
            <span className="signup-link" onClick={handleSignupClick}>
              Sign Up
            </span>
          </p>
        </div>

        {/* --- Role Boxes --- */}
        <section className="roles-section">
          <div className="role-card">
            <User className="role-icon" />
            <h4>Patient</h4>
            <p>
              View prescriptions, share health data, and consult with doctors securely.
            </p>
          </div>
          <div className="role-card">
            <Stethoscope className="role-icon" />
            <h4>Doctor</h4>
            <p>
              Access patient history, prescribe treatments, and manage consultations efficiently.
            </p>
          </div>
          <div className="role-card">
            <Pill className="role-icon" />
            <h4>Chemist</h4>
            <p>
              Verify prescriptions and dispense medicines directly from verified records.
            </p>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="footer">
        <p>© 2025 Mediconnect. All rights reserved.</p>
      </footer>
    </div>
  );
}
