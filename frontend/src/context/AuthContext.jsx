import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (userData) => {
        setUser(userData);

        localStorage.setItem(
            "researchAI_user",
            JSON.stringify(userData)
        );
    };

    const logout = () => {
        setUser(null);

        localStorage.removeItem("researchAI_user");
        localStorage.removeItem("researchAI_token");
    };

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem("researchAI_token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/users/me`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    logout();
                    setLoading(false);
                    return;
                }

                const data = await response.json();

                const userData = {
                    user_id: data.user_id,
                    name: data.name,
                    email: data.email,
                };

                setUser(userData);

                localStorage.setItem(
                    "researchAI_user",
                    JSON.stringify(userData)
                );

            } catch (error) {
                logout();
            }

            setLoading(false);
        };

        verifyUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: Boolean(user),
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
