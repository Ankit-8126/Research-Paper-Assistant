
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "../styles/chat-assistant.css";

import {
    sendPaperChat,
    getChatHistory,
    clearChatHistory,
} from "../services/api";

const initialMessage = {
    id: "welcome",
    type: "ai",
    text: "Hello! I'm your Research AI Assistant. Ask me anything about your uploaded research paper.",
};

function ChatAssistant() {
    const [searchParams] = useSearchParams();
    const paperId = searchParams.get("paperId");

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([initialMessage]);

    const [isTyping, setIsTyping] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadChatHistory = async () => {
            if (!paperId) {
                setMessages([initialMessage]);
                return;
            }

            try {
                const data = await getChatHistory(paperId);

                if (!isMounted) return;

                const history = data.chat_history || [];

                const formattedMessages = history.map((chat, index) => ({
                    id: `history-${index}`,
                    type: chat.role === "user" ? "user" : "ai",
                    text: chat.content,
                }));

                setMessages([initialMessage, ...formattedMessages]);
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Unable to load chat history.");
                }
            }
        };

        loadChatHistory();

        return () => {
            isMounted = false;
        };
    }, [paperId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedMessage = message.trim();

        if (!trimmedMessage || isTyping) {
            return;
        }

        if (!paperId) {
            setError("Please open a research paper before starting a chat.");
            return;
        }

        const userMessage = {
            id: Date.now(),
            type: "user",
            text: trimmedMessage,
        };

        setMessages((prev) => [...prev, userMessage]);
        setMessage("");
        setIsTyping(true);
        setError("");

        try {
            const data = await sendPaperChat(paperId, trimmedMessage);

            const aiMessage = {
                id: Date.now() + 1,
                type: "ai",
                text: data.answer,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            setError(err.message || "Unable to get an AI response.");
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearChat = async () => {
        if (!paperId || isClearing || isTyping) {
            return;
        }

        try {
            setIsClearing(true);
            setError("");

            await clearChatHistory(paperId);

            setMessages([initialMessage]);
            setMessage("");
        } catch (err) {
            setError(err.message || "Unable to clear chat history.");
        } finally {
            setIsClearing(false);
        }
    };

    const handleSuggestion = (suggestion) => {
        setMessage(suggestion);
    };

    return (
        <main className="chat-page">

            <div className="chat-header">
                <div>
                    <span className="chat-label">
                        AI RESEARCH ASSISTANT
                    </span>

                    <h1>Research AI Assistant</h1>

                    <p>
                        Ask questions, understand papers, and get help
                        with your research.
                    </p>

                    {paperId && (
                        <p>Connected Paper ID: #{paperId}</p>
                    )}
                </div>

                <div className="chat-header-actions">
                    <div className="ai-status">
                        <span></span>
                        AI Assistant
                    </div>

                    <button
                        type="button"
                        className="clear-chat-button"
                        onClick={handleClearChat}
                        disabled={isClearing || isTyping || !paperId}
                    >
                        {isClearing ? "Clearing..." : "Clear Chat"}
                    </button>
                </div>
            </div>

            <section className="chat-container">

                <div className="chat-messages">

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`message-row ${msg.type}`}
                        >
                            <div className="message-avatar">
                                {msg.type === "ai" ? "🤖" : "👤"}
                            </div>

                            <div className="message-bubble">
                                <ReactMarkdown>
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="message-row ai">
                            <div className="message-avatar">
                                🤖
                            </div>

                            <div className="message-bubble typing-bubble">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                </div>

                {error && (
                    <p className="chat-error">
                        {error}
                    </p>
                )}

                <form
                    className="chat-input-area"
                    onSubmit={handleSubmit}
                >
                    <input
                        type="text"
                        placeholder="Ask something about your research..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isTyping || !paperId}
                    />

                    <button
                        type="submit"
                        disabled={!message.trim() || isTyping || !paperId}
                    >
                        {isTyping ? "..." : "Send"}
                    </button>
                </form>

            </section>

            <div className="suggestion-section">
                <p>Try asking:</p>

                <div className="suggestions">
                    <button
                        type="button"
                        onClick={() =>
                            handleSuggestion("Summarize this research paper")
                        }
                    >
                        Summarize a paper
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleSuggestion("What are the key findings?")
                        }
                    >
                        Find key findings
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleSuggestion("Explain the methodology")
                        }
                    >
                        Explain methodology
                    </button>
                </div>
            </div>

        </main>
    );
}

export default ChatAssistant;
