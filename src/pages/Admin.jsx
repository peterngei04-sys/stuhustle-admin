import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleApprove = async (userId, index) => {
    const userRef = doc(db, "users", userId);
    const userData = users.find(u => u.id === userId);

    const withdrawals = [...(userData.withdrawals || [])];
    withdrawals[index].status = "approved";

    await updateDoc(userRef, { withdrawals });

    setUsers(users.map(u =>
      u.id === userId ? { ...u, withdrawals } : u
    ));

    setSelectedUser({ ...userData, withdrawals });
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-wrapper">

      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search user by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Balance</th>
              <th>Pending</th>
              <th>Withdrawals</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} onClick={() => setSelectedUser(user)}>
                <td>{user.email}</td>
                <td>${user.balanceUSD || 0}</td>
                <td>${user.pendingUSD || 0}</td>
                <td>{user.withdrawals?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <h2>User Details</h2>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Balance:</strong> ${selectedUser.balanceUSD || 0}</p>
            <p><strong>Pending:</strong> ${selectedUser.pendingUSD || 0}</p>

            <h3>Withdrawals</h3>
            {selectedUser.withdrawals?.length > 0 ? (
              selectedUser.withdrawals.map((w, i) => (
                <div key={i} className="withdraw-item">
                  <span>
                    ${w.amount} → ${w.netAmount} ({w.status})
                  </span>

                  {w.status === "pending" && (
                    <button
                      onClick={() => handleApprove(selectedUser.id, i)}
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>No withdrawals</p>
            )}

            <h3>Activity</h3>
            {selectedUser.activities?.length > 0 ? (
              selectedUser.activities.map((act, i) => (
                <p key={i}>• {act}</p>
              ))
            ) : (
              <p>No activity</p>
            )}

            <button
              className="close-btn"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
