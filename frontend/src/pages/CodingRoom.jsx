/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import api from "../utils/api";
import { getSocket } from "../socket/socket";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

const CodingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("// Start coding...");
  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, []);

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

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId });
      }
    };
  }, [user]);

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

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setOutput("Running...");
      const res = await api.post("/code/execute-code", {
        code,
        language,
        input,
      });
      setOutput(res.data.output || "");
      toast.success("Executed");
    } catch {
      toast.error("Execution failed");
    }
    setIsRunning(false);
  };

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

  return (
    <div className="h-screen flex flex-col bg-dark-100 text-white">
      <div className="border-b border-dark-400 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="text-xs text-gray-400">Room</div>
        <div className="font-mono text-sm text-gray-200">{roomId}</div>
        <div className="text-xs text-gray-500">Users: {users.length}</div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-dark-300 border border-dark-400 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleCodeChange}
        />
      </div>

      <div className="h-56 border-t border-dark-400 bg-dark-200 grid grid-cols-1 md:grid-cols-2">
        <div className="p-3 border-b md:border-b-0 md:border-r border-dark-400">
          <div className="text-xs uppercase text-gray-400">Input</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter input for the program"
            className="mt-2 w-full h-[calc(100%-1.5rem)] resize-none bg-dark-300 border border-dark-400 rounded p-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="p-3">
          <div className="text-xs uppercase text-gray-400">Output</div>
          <pre className="mt-2 w-full h-[calc(100%-1.5rem)] overflow-auto bg-dark-300 border border-dark-400 rounded p-2 text-xs text-gray-200 whitespace-pre-wrap">
            {output || "Output will appear here"}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodingRoom;
