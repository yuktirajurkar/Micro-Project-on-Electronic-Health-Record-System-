import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import "./Signup.css";

export default function Signup() {
  const [role, setRole] = useState("patient"); // default selected tab
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    age: "",
    contact: "",
  });
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [generatedUID, setGeneratedUID] = useState("");

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validation rules
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (role === "patient") {
      if (!formData.age || formData.age < 1)
        newErrors.age = "Please enter a valid age";
    }
    if (!/^\d{10}$/.test(formData.contact))
      newErrors.contact = "Enter a valid 10-digit contact number";
    if (role !== "patient" && !formData.full_name.trim())
      newErrors.full_name = "Full name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let tableName = "";
      let insertData = {};

      if (role === "patient") {
        tableName = "patients";
        insertData = {
          username: formData.username,
          age: formData.age,
          contact: formData.contact,
        };
      } else if (role === "doctor") {
        tableName = "doctors";
        insertData = {
          username: formData.username,
          full_name: formData.full_name,
          contact: formData.contact,
        };
      } else if (role === "chemist") {
        tableName = "chemists";
        insertData = {
          username: formData.username,
          full_name: formData.full_name,
          contact: formData.contact,
        };
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert([insertData])
        .select("*");

      if (error) throw error;

      if (role === "patient" && data && data.length > 0) {
        setGeneratedUID(data[0].uid);
      }

      setShowPopup(true);
      setFormData({ username: "", full_name: "", age: "", contact: "" });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const closePopup = () => setShowPopup(false);

  return (
    <div className="signup-container">
      <header className="signup-header">
        <div className="header-left">
          <h1>Mediconnect</h1>
        </div>
        <button className="back-btn" onClick={() => window.history.back()}>
          Back to Login
        </button>
      </header>

      <main className="signup-main">
        <div className="signup-card">
          <div className="role-tabs">
            <button
              className={role === "patient" ? "active" : ""}
              onClick={() => setRole("patient")}
            >
              Patient
            </button>
            <button
              className={role === "doctor" ? "active" : ""}
              onClick={() => setRole("doctor")}
            >
              Doctor
            </button>
            <button
              className={role === "chemist" ? "active" : ""}
              onClick={() => setRole("chemist")}
            >
              Chemist
            </button>
          </div>

          <h2>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</h2>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
              />
              {errors.username && <p className="error">{errors.username}</p>}
            </div>

            {role === "patient" && (
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                />
                {errors.age && <p className="error">{errors.age}</p>}
              </div>
            )}

            {role !== "patient" && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
                {errors.full_name && <p className="error">{errors.full_name}</p>}
              </div>
            )}

            <div className="form-group">
              <label>Contact</label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter 10-digit contact number"
              />
              {errors.contact && <p className="error">{errors.contact}</p>}
            </div>

            <button type="submit" className="signup-btn">
              Sign Up
            </button>
          </form>
        </div>
      </main>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <button className="close-popup" onClick={closePopup}>
              ✖
            </button>
            <div className="popup-icon">✅</div>
            <h3>Registration Successful!</h3>
            {role === "patient" ? (
              <>
                <p>Your unique Patient ID (UID):</p>
                <div className="uid-box">{generatedUID}</div>
              </>
            ) : (
              <p>You can now log in with your username.</p>
            )}
            <button className="continue-btn" onClick={closePopup}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
