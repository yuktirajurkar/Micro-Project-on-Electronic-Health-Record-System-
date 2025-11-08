import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
// import { supabase } from "../supabaseClient";
import { supabase } from "../supabaseClient.js";
import "./Dashboard.css";

export default function Dashboard() {
  const location = useLocation();
  const { username, userType } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [tests, setTests] = useState([]);
  const [allergies, setAllergies] = useState([]);

  // Form states (for doctors)
  const [newPrescription, setNewPrescription] = useState({
    doctor_name: "",
    medicines: "",
    dosage: "",
  });
  const [newTest, setNewTest] = useState({
    test_name: "",
    file: null, // file upload
  });
  const [newAllergy, setNewAllergy] = useState({
    allergen: "",
    severity: "",
  });

  // Fetch patient and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      try {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("username", username)
          .single();

        if (patientError) throw patientError;
        setPatient(patientData);

        const patientId = patientData.patient_id;

        // Fetch prescriptions, tests, allergies
        const { data: presData } = await supabase
          .from("prescriptions")
          .select("*")
          .eq("patient_id", patientId)
          .order("date", { ascending: false });

        const { data: testData, error: testError } = await supabase
        .from("past_tests")
        .select("*")
        .eq("patient_id", patientId);
        if (testError) console.error("Error fetching tests:", testError);

        const { data: allergyData } = await supabase
          .from("allergies")
          .select("*")
          .eq("patient_id", patientId);

        setPrescriptions(presData || []);
        setTests(testData || []);
        setAllergies(allergyData || []);
      } catch (err) {
        console.error("Error fetching data:", err.message);
      }
    };

    fetchData();
  }, [username]);

  // Add new prescription
  const handleAddPrescription = async () => {
    if (!patient) return;
    const { error } = await supabase.from("prescriptions").insert([
      {
        patient_id: patient.patient_id,
        doctor_name: newPrescription.doctor_name,
        medicines: newPrescription.medicines,
        dosage: newPrescription.dosage,
      },
    ]);
    if (error) alert(error.message);
    else {
      alert("Prescription added!");
      setNewPrescription({ doctor_name: "", medicines: "", dosage: "" });
      window.location.reload();
    }
  };

  // 🔹 Upload test image to Supabase storage + add record
  const handleAddTest = async () => {
    if (!patient) return;
    if (!newTest.test_name || !newTest.file) {
      alert("Please enter test name and select an image file.");
      return;
    }

    try {
      // Step 1: Upload file to Supabase Storage
      const fileExt = newTest.file.name.split(".").pop();
      const fileName = `${patient.username}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("test_images") // make sure this bucket exists
        .upload(filePath, newTest.file);

      if (uploadError) throw uploadError;

      // Step 2: Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("test_images")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      // Step 3: Insert test record into database
      const { error: insertError } = await supabase.from("past_tests").insert([
        {
          patient_id: patient.patient_id,
          test_name: newTest.test_name,
          image_url: publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      alert("✅ Test added and image uploaded successfully!");
      setNewTest({ test_name: "", file: null });
      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err.message);
      alert("❌ Error uploading test: " + err.message);
    }
  };

  // Add new allergy
  const handleAddAllergy = async () => {
    if (!patient) return;
    const { error } = await supabase.from("allergies").insert([
      {
        patient_id: patient.patient_id,
        allergen: newAllergy.allergen,
        severity: newAllergy.severity,
        added_by: newPrescription.doctor_name,
      },
    ]);
    if (error) alert(error.message);
    else {
      alert("Allergy added!");
      setNewAllergy({ allergen: "", severity: "" });
      window.location.reload();
    }
  };

  if (!patient)
    return (
      <div className="dashboard-container">
        <h2>Loading patient data...</h2>
      </div>
    );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Mediconnect Dashboard</h1>
        <p>
          Welcome, <strong>{userType}</strong> — Viewing records for{" "}
          <strong>{patient.username}</strong>
        </p>
      </header>

      {/* PRESCRIPTIONS SECTION */}
      <section className="dashboard-section">
        <h2>Prescriptions</h2>
        {prescriptions.length > 0 ? (
          prescriptions.map((p) => (
            <div key={p.prescription_id} className="card">
              <p>
                <strong>Doctor:</strong> {p.doctor_name}
              </p>
              <p>
                <strong>Medicines:</strong> {p.medicines}
              </p>
              <p>
                <strong>Dosage:</strong> {p.dosage}
              </p>
              <p>
                <strong>Date:</strong> {p.date}
              </p>
            </div>
          ))
        ) : (
          <p>No prescriptions available.</p>
        )}

        {userType === "doctor" && (
          <div className="form-card">
            <h3>Add Prescription</h3>
            <input
              type="text"
              placeholder="Doctor Name"
              value={newPrescription.doctor_name}
              onChange={(e) =>
                setNewPrescription({ ...newPrescription, doctor_name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Medicines"
              value={newPrescription.medicines}
              onChange={(e) =>
                setNewPrescription({ ...newPrescription, medicines: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Dosage"
              value={newPrescription.dosage}
              onChange={(e) =>
                setNewPrescription({ ...newPrescription, dosage: e.target.value })
              }
            />
            <button onClick={handleAddPrescription}>Add</button>
          </div>
        )}
      </section>

      {/* PAST TESTS SECTION */}
      {(userType === "patient" || userType === "doctor") && (
        <section className="dashboard-section">
          <h2>Past Tests</h2>
          {tests.length > 0 ? (
            tests.map((t) => (
              <div key={t.test_id} className="card">
                <p>
                  <strong>Test:</strong> {t.test_name}
                </p>
                {t.image_url && (
                  <img src={t.image_url} alt={t.test_name} className="test-image" />
                )}
              </div>
            ))
          ) : (
            <p>No tests available.</p>
          )}

          {userType === "doctor" && (
            <div className="form-card">
              <h3>Add Test</h3>
              <input
                type="text"
                placeholder="Test Name"
                value={newTest.test_name}
                onChange={(e) =>
                  setNewTest({ ...newTest, test_name: e.target.value })
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewTest({ ...newTest, file: e.target.files[0] })
                }
              />
              <button onClick={handleAddTest}>Upload Test</button>
            </div>
          )}
        </section>
      )}

      {/* ALLERGIES SECTION */}
      {(userType === "patient" || userType === "doctor") && (
        <section className="dashboard-section">
          <h2>Allergies</h2>
          {allergies.length > 0 ? (
            allergies.map((a) => (
              <div key={a.allergy_id} className="card">
                <p>
                  <strong>Allergen:</strong> {a.allergen}
                </p>
                <p>
                  <strong>Severity:</strong> {a.severity}
                </p>
                <p>
                  <strong>Added by:</strong> {a.added_by}
                </p>
              </div>
            ))
          ) : (
            <p>No allergies recorded.</p>
          )}

          {userType === "doctor" && (
            <div className="form-card">
              <h3>Add Allergy</h3>
              <input
                type="text"
                placeholder="Allergen"
                value={newAllergy.allergen}
                onChange={(e) =>
                  setNewAllergy({ ...newAllergy, allergen: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Severity"
                value={newAllergy.severity}
                onChange={(e) =>
                  setNewAllergy({ ...newAllergy, severity: e.target.value })
                }
              />
              <button onClick={handleAddAllergy}>Add Allergy</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
