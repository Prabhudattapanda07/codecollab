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
const chatEndRef = useRef(null);


// ✅ Check user login
useEffect(() => {

const userData = localStorage.getItem("user");

if (!userData) {
navigate("/auth/login");
return;
}

setUser(JSON.parse(userData));

}, []);


// ✅ Load code and connect socket
useEffect(() => {

if (!user) return;

socketRef.current = getSocket();

socketRef.current.emit("join-room", {

roomId,
userName: user.name

});

loadCode();

socketRef.current.on("code-update", ({ code }) => {

setCode(code);

});

socketRef.current.on("room-users", (usersList) => {

setUsers(usersList);

});

socketRef.current.on("chat-message", (msg) => {

setMessages(prev => [...prev, msg]);

});

return () => {

socketRef.current.emit("leave-room", { roomId });

};

}, [user]);


// ✅ Load code from database
const loadCode = async () => {

try {

const res = await api.get(`/code/load-code/:${roomId}`);

if (res.data.success) {

setCode(res.data.code.code);

setLanguage(res.data.code.language);

}

} catch {

toast.error("Failed to load code");

}

};


// ✅ Save Code
const handleSaveCode = async () => {

try {

setIsSaving(true);

await api.post("/code/save-code", {

roomId,
code,
language

});

toast.success("Code saved");

} catch {

toast.error("Save failed");

}

setIsSaving(false);

};


// ✅ Run Code
const handleRunCode = async () => {

try {

setIsRunning(true);

setOutput("Running...");

const res = await api.post("/code/execute-code", {

code,
language

});

setOutput(res.data.output);

toast.success("Executed");

} catch {

toast.error("Execution failed");

}

setIsRunning(false);

};


// ✅ Code change
const handleCodeChange = (value) => {

setCode(value);

socketRef.current.emit("code-change", {

roomId,
code: value

});

};


// ✅ Send Chat
const sendMessage = (e) => {

e.preventDefault();

socketRef.current.emit("chat-message", {

roomId,
message: messageInput,
userName: user.name,
timestamp: new Date()

});

setMessageInput("");

};


// UI
return (

<div className="h-screen flex">

{/* Editor */}

<div className="flex-1">

<Editor

height="70%"

language={language}

value={code}

theme="vs-dark"

onChange={handleCodeChange}

/>


{/* Console */}

<div className="bg-black text-white p-3 h-[30%]">

<button onClick={handleRunCode}>

Run

</button>

<button onClick={handleSaveCode}>

Save

</button>

<pre>

{output}

</pre>

</div>

</div>



{/* Chat */}

<div className="w-80 bg-gray-900 text-white">

<div>

Users:

{users.map((u,i)=> <div key={i}>{u}</div>)}

</div>


<div>

{messages.map((m,i)=>(

<div key={i}>

<b>{m.userName}</b> : {m.message}

</div>

))}

</div>


<form onSubmit={sendMessage}>

<input

value={messageInput}

onChange={(e)=>setMessageInput(e.target.value)}

/>

<button>

Send

</button>

</form>

</div>


</div>

);

};

export default CodingRoom;