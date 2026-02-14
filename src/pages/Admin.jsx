import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, "users");
        const usersSnapshot = await getDocs(usersCol);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleApproveWithdrawal = async (userId, withdrawalIndex) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = users.find(u => u.id === userId);
      if (!userDoc) return;

      const withdrawals = [...userDoc.withdrawals];
      withdrawals[withdrawalIndex].status = "approved";

      await updateDoc(userRef, { withdrawals });
      setUsers(users.map(u => u.id === userId ? { ...u, withdrawals } : u));
    } catch (err) {
      console.error("Failed to approve withdrawal:", err);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  if (loading) return <div className="admin-loading">Loading users...</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <main className="admin-main">
        <h2>Users & Withdrawals</h2>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Balance</th>
                <th>Pending</th>
                <th>Withdrawals</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>${user.balanceUSD || 0}</td>
                  <td>${user.pendingUSD || 0}</td>
                  <td>
                    {user.withdrawals && user.withdrawals.length > 0 ? (
                      <ul>
                        {user.withdrawals.map((w, idx) => (
                          <li key={idx}>
                            ${w.amount} → {w.netAmount} ({w.status})
                            {w.status === "pending" && (
                              <button
                                className="approve-btn"
                                onClick={() => handleApproveWithdrawal(user.id, idx)}
                              >
                                Approve
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No withdrawals</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
