
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";
import "../styles/auth.css";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = await loginUser(formData);

            localStorage.setItem(
                "researchAI_token",
                data.access_token
            );

            const userData = {
                user_id: data.user_id,
                name: data.name,
                email: formData.email,
            };

            login(userData);

            alert("Login successful");

            navigate("/dashboard");

        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome back</h1>

                    <p>
                        Login to continue your research journey.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="auth-form"
                >
                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                    >
                        Login
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/signup">
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default Login;
