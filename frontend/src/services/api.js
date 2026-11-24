
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("researchAI_token");

    const headers = {
        ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail || "Something went wrong. Please try again."
        );
    }

    return data;
};

export const signupUser = (userData) => {
    return apiRequest("/users/signup", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};

export const loginUser = (userData) => {
    return apiRequest("/users/login", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};

export const getCurrentUser = () => {
    return apiRequest("/users/me");
};

export const getPapers = () => {
    return apiRequest("/papers/");
};

export const uploadPaper = (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest("/papers/upload", {
        method: "POST",
        body: formData,
    });
};

export const extractPaperText = (paperId) => {
    return apiRequest(`/papers/${paperId}/extract-text`);
};

export const getPaperText = (paperId) => {
    return apiRequest(`/papers/${paperId}/text`);
};

export const getPaperSummary = (paperId) => {
    return apiRequest(`/papers/${paperId}/summary`);
};

export const getPaperKeyPoints = (paperId) => {
    return apiRequest(`/papers/${paperId}/key-points`);
};

export const sendPaperChat = (paperId, question) => {
    return apiRequest(`/papers/${paperId}/chat`, {
        method: "POST",
        body: JSON.stringify({ question }),
    });
};

export const getChatHistory = (paperId) => {
    return apiRequest(`/papers/${paperId}/chat-history`);
};

export const clearChatHistory = (paperId) => {
    return apiRequest(`/papers/${paperId}/chat-history`, {
        method: "DELETE",
    });
};



export const searchPublishedPapers = (query, perPage = 10) => {
    const params = new URLSearchParams({
        query: query,
        per_page: perPage,
    });

    return apiRequest(`/published-papers/search?${params.toString()}`);
};

export const getPaperPdf = async (paperId) => {
    const token = localStorage.getItem("researchAI_token");

    const response = await fetch(
        `${API_BASE_URL}/papers/${paperId}/pdf`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
            errorData.detail || "Unable to load PDF."
        );
    }

    return await response.blob();
};