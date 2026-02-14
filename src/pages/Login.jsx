import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (userCredential.user.email !== "sstuhustle@gmail.com") {
        setError("Access denied. Not an admin.");
        return;
      }

      setShowSuccess(true);

      setTimeout(() => {
        navigate("/admin");
      }, 1500);

    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="success-popup">
          Login Successful 🎉
        </div>
      )}

      <div className="login-container">
        <div className="login-box">
          <h2>Stuhustle Admin</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Login</button>
          </form>

          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </>
  );
}
