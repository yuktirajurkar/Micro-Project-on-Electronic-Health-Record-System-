import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("patient");
  const [formData, setFormData] = useState({ username: "", uid: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const last = localStorage.getItem("lastSignedUpRole");
    if (last) setRole(last);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError("");
  };

  const handleAbout = () => {
    window.alert(
      "Mediconnect connects Patients, Doctors, and Chemists.\nPatients view their records via UID. Doctors can view/add for any patient by UID. Chemists can view prescriptions."
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }

    try {
      let table = role === "patient" ? "patients" : role === "doctor" ? "doctors" : "chemists";
      let q = supabase.from(table).select("*").eq("username", formData.username);

      if (role === "patient") {
        if (!formData.uid.trim()) {
          setError("Patient UID is required");
          return;
        }
        q = q.eq("uid", formData.uid);
      }

      const { data, error } = await q.single();
      if (error || !data) {
        setError("Invalid credentials or role mismatch.");
        return;
      }

      navigate("/dashboard", { state: { userType: role, userData: data } });
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-section">
            <Heart className="logo-icon" fill="currentColor" />
            <h1 className="logo-text">Mediconnect</h1>
          </div>
          <div className="header-actions">
            <button className="signup-btn" onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>
      </header>

      {/* Hero / Description */}
      <section className="hero">
        <h2>Your simple, secure EHR.</h2>
        <p>
        “<strong>Have you ever repeated a test just because previous reports weren’t available?</strong>
         Here’s the fix — a<strong> digital EHR platform </strong> that stores every patient record in one place, making healthcare <strong>faster, smarter, and more connected.</strong>”
        </p>
        <p><br></br></p>
        <p>
          “<strong>No more lost reports. No more repeated tests</strong>. Just one secure EHR for every patient because <strong>every detail matters in your care.</strong>”

        </p>

      </section>

      {/* Login Card */}
      <main className="main-content">
        <div className="login-card">
          <div className="role-tabs">
            <button className={role === "patient" ? "active" : ""} onClick={() => { setRole("patient"); setFormData({ username: "", uid: "" }); setError(""); }}>
              Patient
            </button>
            <button className={role === "doctor" ? "active" : ""} onClick={() => { setRole("doctor"); setFormData({ username: "", uid: "" }); setError(""); }}>
              Doctor
            </button>
            <button className={role === "chemist" ? "active" : ""} onClick={() => { setRole("chemist"); setFormData({ username: "", uid: "" }); setError(""); }}>
              Chemist
            </button>
          </div>

          <h2>{role.charAt(0).toUpperCase() + role.slice(1)} Login</h2>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Enter your username" />
            </div>

            {role === "patient" && (
              <div className="input-group">
                <label>Patient UID</label>
                <input type="text" name="uid" value={formData.uid} onChange={handleChange} placeholder="Enter your Patient UID" />
              </div>
            )}

            {error && <p className="error">{error}</p>}
            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </main>

      {/* Roles Summary */}
      <section className="roles-strip">
        <div className="role-card">
          <h4>Patient</h4>
          <p>View your prescriptions, tests (with images), and allergy list using your UID.</p>
        </div>
        <div className="role-card">
          <h4>Doctor</h4>
          <p>Enter a patient UID to view and add prescriptions, tests, and allergies.</p>
        </div>
        <div className="role-card">
          <h4>Chemist</h4>
          <p>Enter a patient UID to view and verify prescriptions only.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <h5>Mediconnect</h5>
            <p>Secure, role-based electronic health records — made simple.</p>
          </div>
          <div>
            <h5>Links</h5>
            <ul>
              <li><button className="linklike" onClick={handleAbout}>About</button></li>
              <li><button className="linklike" onClick={() => navigate("/signup")}>Sign Up</button></li>
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <p>support@mediconnect.com</p>
            <p>+91 111-123-4567</p>
          </div>
        </div>
        <div className="footer-bottom">© 2025 Mediconnect. All rights reserved.</div>
      </footer>
    </div>
  );
}
