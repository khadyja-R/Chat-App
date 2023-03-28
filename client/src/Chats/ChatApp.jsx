import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./ChatApp.css";
import { AiOutlineSend } from "react-icons/ai";

const socket = io("http://localhost:3002", {
  withCredentials: true,
  extraHeaders: {
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": true,
  },
});

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const messageRef = useRef(null);

  useEffect(() => {
    socket.on("new-message", handleNewMessage);

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    fetchMessages();

    // Unsubscribe from socket events when component unmounts
    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const handleNewMessage = (message) => {
    setMessages((prevState) => [...prevState, message]);
  };

  const handleConnect = () => {
    console.log("Connected to server.");
    if (username.trim() !== "") {
      socket.emit("auth", username);
      setAuthenticated(true);
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnected from server.");
  };

  const fetchMessages = async () => {
    const response = await fetch("http://localhost:3002/messages", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    setMessages(data);
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (message.trim() !== "") {
      socket.emit("new-message", { message });
      setMessage("");
      messageRef.current.focus();
    }
  };

  const setUsernameAndConnect = (event) => {
    event.preventDefault();
    if (username.trim() !== "") {
      setUsername(username.trim());
      socket.emit("auth", username.trim());
      setAuthenticated(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="login-container">
        <h1 className="text-center mb-4"> Welcome to  Chat App</h1>
        <form onSubmit={setUsernameAndConnect} className="p-4 rounded shadow">
          <input
            className="form-control mb-3"
            type="text"
            id="username"
            placeholder="Enter username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <button className="btn btn-primary btn-block">set username</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-app-container">
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.username === username ? "sent" : "received"
            }`}
          >
            <span className="username">{message.username}: </span>
            <span className="message-body">{message.message}</span>
          </div>
        ))}
      </div>
      <form className="message-input-container" onSubmit={sendMessage}>
        <input
          className="message-input"
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          ref={messageRef}
        />

        <button className="send-button" type="submit">
          <AiOutlineSend />
        </button>
      </form>
    </div>
  );
}

export default ChatApp;
