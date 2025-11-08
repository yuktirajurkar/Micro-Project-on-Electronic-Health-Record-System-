import React, { useState } from "react";
import "./Signup.css";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    age: "",
    contact: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.age) newErrors.age = "Age is required";
    if (!formData.contact.trim()) newErrors.contact = "Contact number is required";
    else if (!/^\d{10}$/.test(formData.contact))
      newErrors.contact = "Please enter a valid 10-digit number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from("patients")
        .select("*")
        .eq("username", formData.username)
        .single();

      if (existingUser) {
        alert("Username already exists. Try another one.");
        setLoading(false);
        return;
      }

      // Insert new user into Supabase
      const { error } = await supabase.from("patients").insert([
        {
          username: formData.username,
          age: formData.age,
          contact: formData.contact,
        },
      ]);

      if (error) throw error;

      setShowPopup(true);
      setFormData({ username: "", age: "", contact: "" });

      setTimeout(() => {
        setShowPopup(false);
        navigate("/");
      }, 2500);
    } catch (err) {
      alert("Error signing up: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <header className="signup-header">
        <div className="header-left">
          {/* <span className="heart">❤️</span> */}
          <h1>Mediconnect</h1>
        </div>
        <button className="back-btn" onClick={() => navigate("/")}>
          Back to Login
        </button>
      </header>

      <main className="signup-main">
        <div className="signup-card">
          <div className="signup-title">
            <div className="signup-icon">👤</div>
            <h2>Create Account</h2>
            <p>Join Mediconnect EHR System</p>
          </div>

          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
              />
              {errors.username && <p className="error-text">{errors.username}</p>}
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
              />
              {errors.age && <p className="error-text">{errors.age}</p>}
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter 10-digit contact number"
              />
              {errors.contact && <p className="error-text">{errors.contact}</p>}
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="redirect-text">
            Already have an account?{" "}
            <span className="login-link" onClick={() => navigate("/")}>
              Login
            </span>
          </p>
        </div>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <div className="popup-icon">✅</div>
              <h3>Registered Successfully!</h3>
              <p>Welcome to Mediconnect. You can now login.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="signup-footer">
        <p>© 2025 Mediconnect EHR System. All rights reserved.</p>
      </footer>
    </div>
  );
}
