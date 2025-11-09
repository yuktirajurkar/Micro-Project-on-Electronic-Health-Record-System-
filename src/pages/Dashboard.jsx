import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserCircle2, X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userType, userData } = state || {};

  const [patient, setPatient] = useState(null);
  const [uidInput, setUidInput] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [tests, setTests] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // show more toggles
  const [showMorePres, setShowMorePres] = useState(false);
  const [showMoreTests, setShowMoreTests] = useState(false);
  const [showMoreAllergies, setShowMoreAllergies] = useState(false);

  // image modal (for both doctor + patient)
  const [modalImage, setModalImage] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  // doctor form states
  const [newPrescription, setNewPrescription] = useState({
    medicines: "",
    dosage: "",
  });
  const [newTest, setNewTest] = useState({ test_name: "", file: null });
  const [newAllergy, setNewAllergy] = useState({ allergen: "", severity: "" });

  const isDoctor = userType === "doctor";
  const isPatient = userType === "patient";
  const isChemist = userType === "chemist";

  // Fetch patient data by UID
  const fetchPatientData = async (uidValue) => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("uid", uidValue)
        .single();
      if (error || !data) {
        alert("Patient not found!");
        setPatient(null);
        setPrescriptions([]);
        setTests([]);
        setAllergies([]);
        return;
      }

      setPatient(data);
      const id = data.patient_id;

      const { data: pres } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false });

      const { data: tst } = await supabase
        .from("past_tests")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false });

      const { data: alg } = await supabase
        .from("allergies")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false });

      setPrescriptions(pres || []);
      setTests(tst || []);
      setAllergies(alg || []);
      setShowMorePres(false);
      setShowMoreTests(false);
      setShowMoreAllergies(false);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    if (isPatient && userData?.uid) fetchPatientData(userData.uid);
  }, [isPatient, userData]);

  const handleLogout = () => navigate("/");

  // Add Prescription
  const handleAddPrescription = async () => {
    if (!patient) return alert("No patient selected!");
    if (!newPrescription.medicines || !newPrescription.dosage)
      return alert("Fill all fields!");
    const { error } = await supabase.from("prescriptions").insert([
      {
        patient_id: patient.patient_id,
        doctor_id: userData.doctor_id,
        doctor_name: userData.full_name,
        medicines: newPrescription.medicines,
        dosage: newPrescription.dosage,
      },
    ]);
    if (error) alert(error.message);
    else {
      alert("Prescription added!");
      setNewPrescription({ medicines: "", dosage: "" });
      fetchPatientData(patient.uid);
    }
  };

  // Add Allergy
  const handleAddAllergy = async () => {
    if (!patient) return alert("No patient selected!");
    if (!newAllergy.allergen || !newAllergy.severity)
      return alert("Fill all fields!");
    const { error } = await supabase.from("allergies").insert([
      {
        patient_id: patient.patient_id,
        doctor_id: userData.doctor_id,
        allergen: newAllergy.allergen,
        severity: newAllergy.severity,
      },
    ]);
    if (error) alert(error.message);
    else {
      alert("Allergy added!");
      setNewAllergy({ allergen: "", severity: "" });
      fetchPatientData(patient.uid);
    }
  };

  // Add Test
  const handleAddTest = async () => {
    if (!patient) return alert("No patient selected!");
    if (!newTest.test_name || !newTest.file)
      return alert("Enter test name and select an image!");

    try {
      const ext = newTest.file.name.split(".").pop();
      const fileName = `${patient.username}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("test_images")
        .upload(fileName, newTest.file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage
        .from("test_images")
        .getPublicUrl(fileName);
      const imageUrl = pub.publicUrl;

      const { error: insertError } = await supabase.from("past_tests").insert([
        {
          patient_id: patient.patient_id,
          doctor_id: userData.doctor_id,
          test_name: newTest.test_name,
          image_url: imageUrl,
        },
      ]);
      if (insertError) throw insertError;

      alert("Test added!");
      setNewTest({ test_name: "", file: null });
      fetchPatientData(patient.uid);
    } catch (err) {
      alert("Upload error: " + err.message);
    }
  };

  // "Show more" logic
  const visiblePres = showMorePres ? prescriptions : prescriptions.slice(0, 1);
  const visibleTests = showMoreTests ? tests : tests.slice(0, 1);
  const visibleAllergies = showMoreAllergies
    ? allergies
    : allergies.slice(0, 1);

  // Chart data (by month)
  const presChartData = useMemo(() => {
    const byMonth = {};
    prescriptions.forEach((p) => {
      const d = p.created_at ? new Date(p.created_at) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return Object.entries(byMonth)
      .sort()
      .map(([month, count]) => ({ month, count }));
  }, [prescriptions]);

  const testsChartData = useMemo(() => {
    const byMonth = {};
    tests.forEach((t) => {
      const d = t.created_at ? new Date(t.created_at) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return Object.entries(byMonth)
      .sort()
      .map(([month, count]) => ({ month, count }));
  }, [tests]);

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <h1>Mediconnect Dashboard</h1>

        <div className="profile-section">
          <UserCircle2
            className="profile-icon"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />
          {dropdownOpen && (
            <div className="profile-dropdown">
              <p>
                <strong>Role:</strong> {userType}
              </p>
              <p>
                <strong>Username:</strong> {userData.username}
              </p>

              {isPatient && (
                <>
                  <p>
                    <strong>UID:</strong> {userData.uid}
                  </p>
                  <p>
                    <strong>Age:</strong> {userData.age}
                  </p>
                  <p>
                    <strong>Contact:</strong> {userData.contact}
                  </p>
                </>
              )}

              {!isPatient && (
                <>
                  {userData.full_name && (
                    <p>
                      <strong>Full Name:</strong> {userData.full_name}
                    </p>
                  )}
                  <p>
                    <strong>Contact:</strong> {userData.contact}
                  </p>
                  {patient && (
                    <p className="viewing-pill">
                      Viewing: <strong>{patient.username}</strong> (UID:{" "}
                      {patient.uid})
                    </p>
                  )}
                </>
              )}
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* UID FETCH for DOCTOR/CHEMIST */}
      {(isDoctor || isChemist) && (
        <div className="uid-input-box">
          <input
            type="text"
            placeholder="Enter Patient UID"
            value={uidInput}
            onChange={(e) => setUidInput(e.target.value)}
          />
          <button onClick={() => fetchPatientData(uidInput)}>Fetch</button>
        </div>
      )}

      {/* PATIENT HEADER */}
      {patient && (
        <h2 className="section-title">
          Patient: {patient.username}{" "}
          <span className="dim">(UID: {patient.uid})</span>
        </h2>
      )}

      {/* INSIGHTS */}
      {patient && (isPatient || isDoctor) && (
        <section className="dashboard-section">
          <h3>Insights</h3>
          <div className="charts-grid">
            <div className="chart-card">
              <h4>Prescriptions / Month</h4>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={presChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h4>Tests / Month</h4>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={testsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TOTAL COUNTS */}
          <div className="totals-summary">
            <div className="total-box">
              <h4>Total Prescriptions</h4>
              <p>{prescriptions.length}</p>
            </div>
            <div className="total-box">
              <h4>Total Tests</h4>
              <p>{tests.length}</p>
            </div>
            <div className="total-box">
              <h4>Total Allergies</h4>
              <p>{allergies.length}</p>
            </div>
          </div>
        </section>
      )}

      {/* PRESCRIPTIONS */}
      {patient && (
        <section className="dashboard-section">
          <h3>Prescriptions</h3>
          {visiblePres.length > 0 ? (
            visiblePres.map((p) => (
              <div key={p.prescription_id} className="card">
                <p>
                  <strong>Doctor:</strong> {p.doctor_name || "-"}
                </p>
                <p>
                  <strong>Medicines:</strong> {p.medicines}
                </p>
                <p>
                  <strong>Dosage:</strong> {p.dosage}
                </p>
                {p.created_at && (
                  <p className="muted">
                    <strong>Added:</strong>{" "}
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>No prescriptions available.</p>
          )}

          {!showMorePres && prescriptions.length > 1 && (
            <button
              className="showmore-btn"
              onClick={() => setShowMorePres(true)}
            >
              Show more
            </button>
          )}

          {/* Doctor Add Prescription */}
          {isDoctor && patient && (
            <div className="form-card">
              <h4>Add Prescription</h4>
              <input
                type="text"
                placeholder="Medicines"
                value={newPrescription.medicines}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    medicines: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Dosage"
                value={newPrescription.dosage}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    dosage: e.target.value,
                  })
                }
              />
              <button onClick={handleAddPrescription}>Add Prescription</button>
            </div>
          )}
        </section>
      )}

      {/* TESTS */}
      {patient && (isPatient || isDoctor) && (
        <section className="dashboard-section">
          <h3>Past Tests</h3>
          {visibleTests.length > 0 ? (
            visibleTests.map((t) => (
              <div key={t.test_id} className="card test-row">
                <div className="test-name-only">
                  <span className="dot" /> <strong>{t.test_name}</strong>
                </div>
                {t.image_url && (
                  <button
                    className="view-btn"
                    onClick={() => {
                      setModalImage(t.image_url);
                      setModalTitle(t.test_name);
                    }}
                  >
                    View image
                  </button>
                )}
                {t.created_at && (
                  <p className="muted">
                    <strong>Added:</strong>{" "}
                    {new Date(t.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>No tests found.</p>
          )}

          {!showMoreTests && tests.length > 1 && (
            <button
              className="showmore-btn"
              onClick={() => setShowMoreTests(true)}
            >
              Show more
            </button>
          )}

          {/* Doctor Add Test */}
          {isDoctor && patient && (
            <div className="form-card">
              <h4>Add Test</h4>
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

      {/* ALLERGIES */}
      {patient && (isPatient || isDoctor) && (
        <section className="dashboard-section">
          <h3>Allergies</h3>
          {visibleAllergies.length > 0 ? (
            visibleAllergies.map((a) => (
              <div key={a.allergy_id} className="card">
                <p>
                  <strong>Allergen:</strong> {a.allergen}
                </p>
                <p>
                  <strong>Severity:</strong> {a.severity}
                </p>
                {a.created_at && (
                  <p className="muted">
                    <strong>Added:</strong>{" "}
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>No allergies recorded.</p>
          )}

          {!showMoreAllergies && allergies.length > 1 && (
            <button
              className="showmore-btn"
              onClick={() => setShowMoreAllergies(true)}
            >
              Show more
            </button>
          )}

          {/* Doctor Add Allergy */}
          {isDoctor && (
            <div className="form-card">
              <h4>Add Allergy</h4>
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

      {/* IMAGE MODAL (for both patient + doctor) */}
      {(isDoctor || isPatient) && modalImage && (
        <div className="modal-backdrop" onClick={() => setModalImage(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setModalImage(null)}
            >
              <X size={18} />
            </button>
            <h4 className="modal-title">{modalTitle}</h4>
            <img src={modalImage} alt={modalTitle} className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}
