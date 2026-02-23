/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import api from "../utils/api";
import { getSocket } from "../socket/socket";

const CodingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("// Start coding...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [user, setUser] = useState(null);

  const socketRef = useRef(null);

  // Check user login
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, []);

  // Load code and connect socket
  useEffect(() => {
    if (!user) return;

    socketRef.current = getSocket();
    socketRef.current.emit("join-room", {
      roomId,
      userName: user.name,
    });

    loadCode();

    socketRef.current.on("code-update", ({ code }) => {
      setCode(code);
    });

    socketRef.current.on("room-users", (usersList) => {
      setUsers(usersList);
    });

    socketRef.current.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId });
      }
    };
  }, [user]);

  // Load code from database
  const loadCode = async () => {
    try {
      const res = await api.get(`/room/load-code/${roomId}`);
      if (res.data.success) {
        setCode(res.data.code.code);
        setLanguage(res.data.code.language);
      }
    } catch {
      toast.error("Failed to load code");
    }
  };

  // Save Code
  const handleSaveCode = async () => {
    try {
      setIsSaving(true);
      await api.post("/room/save-code", {
        roomId,
        code,
        language,
      });
      toast.success("Code saved");
    } catch {
      toast.error("Save failed");
    }
    setIsSaving(false);
  };

  // Run Code
  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setOutput("Running...");
      const res = await api.post("/code/execute-code", {
        code,
        language,
      });
      setOutput(res.data.output);
      toast.success("Executed");
    } catch {
      toast.error("Execution failed");
    }
    setIsRunning(false);
  };

  // Code change
  const handleCodeChange = (value) => {
    const nextCode = value ?? "";
    setCode(nextCode);
    if (socketRef.current) {
      socketRef.current.emit("code-change", {
        roomId,
        code: nextCode,
      });
    }
  };

  // Send Chat
  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    if (socketRef.current) {
      socketRef.current.emit("chat-message", {
        roomId,
        message: trimmed,
        userName: user?.name || "Anonymous",
        timestamp: new Date(),
      });
    }
    setMessageInput("");
  };

  return (
    <div className="h-screen flex overflow-hidden bg-dark-100 text-white">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={handleCodeChange}
          />
        </div>

        <div className="h-48 border-t border-dark-400 bg-black text-white p-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {isRunning ? "Running..." : "Run"}
            </button>
            <button
              onClick={handleSaveCode}
              disabled={isSaving}
              className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
          <pre className="text-xs text-gray-200 overflow-auto h-28 whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      </div>

      <div className="w-80 max-w-full bg-gray-900 text-white flex flex-col border-l border-gray-800">
        <div className="p-3 border-b border-gray-800">
          <div className="text-sm font-semibold">Room Chat</div>
          <div className="text-xs text-gray-400">Users online: {users.length}</div>
        </div>

        <div className="p-3 border-b border-gray-800">
          <div className="text-xs uppercase text-gray-500 mb-2">Users</div>
          <div className="flex flex-wrap gap-2">
            {users.length === 0 ? (
              <span className="text-xs text-gray-500">No users yet</span>
            ) : (
              users.map((u, i) => (
                <span key={i} className="px-2 py-1 rounded bg-gray-800 text-xs">
                  {u}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 ? (
            <div className="text-xs text-gray-500">No messages yet.</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold text-gray-200">{m.userName}</span>
                <span className="text-gray-400">: </span>
                <span className="text-gray-300">{m.message}</span>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 flex gap-2">
          <input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded bg-gray-800 text-sm text-white outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Type a message..."
          />
          <button className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default CodingRoom;
