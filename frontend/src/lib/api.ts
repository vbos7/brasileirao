import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = Cookies.get("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || "Erro inesperado.";

        if (status === 401 && typeof window !== "undefined") {
            const isAuthPage = ["/login", "/register"].includes(window.location.pathname);
            if (!isAuthPage) {
                Cookies.remove("token");
                Cookies.remove("user");
                window.location.href = "/login";
            }
        }

        return Promise.reject({ status, message, errors: error.response?.data?.errors });
    }
);

export default api;