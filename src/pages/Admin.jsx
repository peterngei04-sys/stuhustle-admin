import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import "../styles/admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState("");

  // 🔐 ADMIN PROTECTION
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return navigate("/login");

      const unsubUser = onSnapshot(
        doc(db, "users", user.uid),
        (snap) => {
          const data = snap.data();
          if (!data || data.role !== "admin") {
            navigate("/");
          }
        }
      );

      return () => unsubUser();
    });

    return () => unsub();
  }, []);

  // 🔥 REAL TIME USERS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const pendingCount = list.reduce(
        (sum, u) =>
          sum +
          (u.withdrawals?.filter(w => w.status === "pending").length || 0),
        0
      );

      if (pendingCount > 0) {
        setNotification("⚠️ New Pending Withdrawals");
      } else {
        setNotification("");
      }

      setUsers(list);
    });

    return () => unsub();
  }, []);

  // 📊 TOTALS
  const totalBalance = users.reduce((sum, u) => sum + (u.balanceUSD || 0), 0);
  const totalPending = users.reduce((sum, u) => sum + (u.pendingUSD || 0), 0);

  // 📈 Revenue Chart Data
  const revenueData = useMemo(() => {
    return users.map(u => ({
      name: u.email?.slice(0, 5),
      balance: u.balanceUSD || 0
    }));
  }, [users]);

  // 📊 Withdrawal Chart Data
  const withdrawalData = useMemo(() => {
    return users.map(u => ({
      name: u.email?.slice(0, 5),
      withdrawals: u.withdrawals?.length || 0
    }));
  }, [users]);

  // 📉 User Growth Data
  const growthData = useMemo(() => {
    return users.map((u, index) => ({
      name: `User ${index + 1}`,
      count: index + 1
    }));
  }, [users]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin">

      <aside className="sidebar">
        <div>
          <h2>Enterprise Admin</h2>
          {notification && <div className="alert">{notification}</div>}
        </div>
        <button onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main">

        <h1>Analytics Dashboard</h1>

        {/* Stats */}
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

        {/* Charts */}
        <div className="charts">

          <div className="chart-box">
            <h3>Revenue Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="balance" stroke="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>Withdrawals Count</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={withdrawalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="withdrawals" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>User Growth</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#facc15" />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Users Table */}
        <input
          className="search"
          placeholder="Search user..."
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
                <tr key={user.id}>
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
    </div>
  );
}
