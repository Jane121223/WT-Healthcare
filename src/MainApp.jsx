import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { useEffect, useState } from "react";

// Accept user data and logout function as props
function MainApp({ user, onLogout }) { 
    
    // State to store fetched prescription data
    const [result, setResult] = useState([]);
    // State for user messages (success/error)
    const [message, setMessage] = useState(null);
    
    // States for form inputs (Prescription fields)
    const [patientName, setPatientName] = useState("");
    const [drugName, setDrugName] = useState("");
    const [dosage, setDosage] = useState("");

    // State to track the ID of the prescription being edited
    const [editingId, setEditingId] = useState(null);

    // Load all prescriptions on component mount
    useEffect(() => {
        loadPrescriptions();
    }, []);

    // Function to fetch all prescriptions from the server
    const loadPrescriptions = () => {
        // Calls the GET API on the Node.js server
        // We now pass the user's ID to get only their prescriptions
        axios.get(`http://localhost:7000/api/viewAll?userId=${user.id}`) 
            .then((res) => setResult(res.data))
            .catch((err) => console.log(err));
    };

    // Function to add a new prescription (POST API)
    const addPrescription = (event) => {
        event.preventDefault();

        axios.post("http://localhost:7000/api/addNew", {
            patientName: patientName,
            drugName: drugName,
            dosage: dosage,
            userId: user.id // Pass the logged-in user's ID
        })
        .then((res) => {
            setMessage(res.data.status);
            loadPrescriptions(); // Refresh the table
            // Clear form fields
            setPatientName('');
            setDrugName('');
            setDosage('');
        })
        .catch((err) => {
            // Handle server-side validation errors
            if (err.response && err.response.data && err.response.data.status) {
                setMessage(err.response.data.status);
            } else {
                // Handle other errors
                setMessage("An unexpected error occurred.");
                console.error(err);
            }
        });
    };

    // Function to update an existing prescription
    const updatePrescription = (event) => {
        event.preventDefault();
        axios.post("http://localhost:7000/api/updatePrescription", { // This endpoint doesn't have validation yet, but it's good practice to add error handling
            id: editingId,
            patientName: patientName,
            drugName: drugName,
            dosage: dosage,
            userId: user.id // Pass the logged-in user's ID for verification
        })
        .then((res) => {
            setMessage(res.data.status);
            cancelEditing(); // Clear form and reset state
            loadPrescriptions(); // Refresh the table
        })
        .catch((err) => {
            // Handle server-side validation errors
            if (err.response && err.response.data && err.response.data.status) {
                setMessage(err.response.data.status);
            } else {
                // Handle other errors
                setMessage("An unexpected error occurred during update.");
                console.error(err);
            }
        });
    };

    // Function to handle form submission (either add or update)
    const handleFormSubmit = (event) => {
        if (editingId) {
            updatePrescription(event);
        } else {
            addPrescription(event);
        }
    };

    // Function to populate the form for editing
    const startEditing = (prescription) => {
        setEditingId(prescription._id);
        setPatientName(prescription.patientName);
        setDrugName(prescription.drugName);
        setDosage(prescription.dosage);
    };

    // Function to cancel editing and clear the form
    const cancelEditing = () => {
        setEditingId(null);
        setPatientName('');
        setDrugName('');
        setDosage('');
    };

    // Function to delete a prescription by its MongoDB ID
    const deletePrescription = (id) => {
        // Calls the POST API on the Node.js server
        axios.post("http://localhost:7000/api/deleteUser", { id: id, userId: user.id })
            .then((res) => {
                setMessage(res.data.status);
                loadPrescriptions(); // Refresh the table
            })
            .catch((err) => console.log(err));
    };

    return (
        <div className="container p-3 mt-4">
            <button className="btn btn-warning float-end" onClick={onLogout}>
                Logout ({user.username})
            </button>
            <div className="p-3 card bg-light text-center w-75 mx-auto">
                <h1 className="mb-4">Healthcare Prescription and Pharmacy App</h1>
                <hr />
                <h3>{editingId ? 'Edit Prescription' : 'Add New Prescription'}</h3>
                {/* ... (rest of your forms and tables) ... */}
                <div className="p-5">
                    <form onSubmit={handleFormSubmit}>
                        {/* Input for Patient Name */}
                        <input
                            placeholder="Patient Name"
                            value={patientName}
                            className="form-control mb-3"
                            required
                            onChange={(e) => setPatientName(e.target.value)}
                        />
                        {/* Input for Drug Name */}
                        <input
                            placeholder="Drug Name"
                            value={drugName}
                            className="form-control mb-3"
                            required
                            onChange={(e) => setDrugName(e.target.value)}
                        />
                        {/* Input for Dosage */}
                        <input
                            placeholder="Dosage (e.g., 5mg, 1 tablet)"
                            value={dosage}
                            className="form-control mb-3"
                            required
                            onChange={(e) => setDosage(e.target.value)}
                        />
                        <button className={`btn ${editingId ? 'btn-success' : 'btn-primary'} btn-lg`}>
                            {editingId ? 'Update Prescription' : 'Add Prescription'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-secondary btn-lg ms-2"
                                onClick={cancelEditing}>
                                Cancel
                            </button>
                        )}
                    </form>
                    <div className="text-danger mt-4 fs-4">
                        {message && <span>{message}</span>}
                    </div>
                    <div className="mt-5">
                        <h3 className="mb-3">View All Prescriptions</h3>
                        <table className="table table-bordered table-stripped">
                            <thead>
                                <tr className="bg-light">
                                    <th>ID</th>
                                    <th>Patient Name</th>
                                    <th>Drug Name</th>
                                    <th>Dosage</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!result || result.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" align="center">No Prescriptions Yet</td>
                                    </tr>
                                ) : (
                                    result.map((prescription, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{prescription.patientName}</td>
                                            <td>{prescription.drugName}</td>
                                            <td>{prescription.dosage}</td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary me-2"
                                                    onClick={() => startEditing(prescription)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => deletePrescription(prescription._id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <hr />
            </div>
        </div>
    );
}

export default MainApp;