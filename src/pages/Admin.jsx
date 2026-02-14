import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(list);
    });

    return () => unsub();
  }, []);

  const handleApprove = async (userId, index) => {
    const userRef = doc(db, "users", userId);
    const userData = users.find(u => u.id === userId);

    const withdrawals = [...(userData.withdrawals || [])];
    withdrawals[index].status = "approved";

    await updateDoc(userRef, { withdrawals });

    setSelectedUser({ ...userData, withdrawals });
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = users.reduce((sum, u) => sum + (u.balanceUSD || 0), 0);
  const totalPending = users.reduce((sum, u) => sum + (u.pendingUSD || 0), 0);

  return (
    <div className="admin">

      <aside className="sidebar">
        <h2>Stuhustle</h2>
        <button onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main">

        <div className="top">
          <h1>Admin Dashboard</h1>
        </div>

        <div className="stats">
          <div className="card">
            <h3>Total Users</h3>
            <p>{users.length}</p>
          </div>

          <div className="card">
            <h3>Total Balance</h3>
            <p>${totalBalance}</p>
          </div>

          <div className="card">
            <h3>Total Pending</h3>
            <p>${totalPending}</p>
          </div>
        </div>

        <input
          className="search"
          placeholder="Search user by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="table-container">
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

      </main>

      {selectedUser && (
        <div className="drawer">
          <div className="drawer-content">
            <h2>{selectedUser.email}</h2>
            <p>Balance: ${selectedUser.balanceUSD || 0}</p>
            <p>Pending: ${selectedUser.pendingUSD || 0}</p>

            <h3>Withdrawals</h3>
            {selectedUser.withdrawals?.length > 0 ? (
              selectedUser.withdrawals.map((w, i) => (
                <div key={i} className="withdraw-row">
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

            <button
              className="close"
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
