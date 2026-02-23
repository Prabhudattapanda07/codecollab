/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getSocket } from '../socket/socket';

const CodingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('// Start coding...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isHtmlPreviewMaximized, setIsHtmlPreviewMaximized] = useState(false);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Initialize socket
    socketRef.current = getSocket();

    // Join room
    socketRef.current.emit('join-room', {
      roomId,
      userName: user.name,
    });

    // Load existing code
    loadCode();

    // Socket event listeners
    socketRef.current.on('code-update', ({ code }) => {
      setCode(code);
    });

    socketRef.current.on('language-update', ({ language }) => {
      setLanguage(language);
    });

    socketRef.current.on('room-users', (usersList) => {
      setUsers(usersList);
    });

    socketRef.current.on('user-joined', ({ userName, users: usersList }) => {
      setUsers(usersList);
      toast.success(`${userName} joined the room`);
    });

    socketRef.current.on('user-left', ({ userName, users: usersList }) => {
      setUsers(usersList);
      toast(`${userName} left the room`, { icon: '👋' });
    });

    socketRef.current.on('chat-message', ({ message, userName, timestamp }) => {
      setMessages((prev) => [...prev, { message, userName, timestamp }]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId });
      }
    };
  }, [roomId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCode = async () => {
    try {
      const response = await api.get(`/room/load-code/${roomId}`);
      if (response.data.success) {
        setCode(response.data.code.code);
        setLanguage(response.data.code.language);
      }
    } catch (error) {
      console.error('Load code error:', error);
    }
  };

  const handleCodeChange = (value) => {
    const nextCode = value ?? '';
    setCode(nextCode);
    if (socketRef.current) {
      socketRef.current.emit('code-change', { roomId, code: nextCode });
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    if (socketRef.current) {
      socketRef.current.emit('language-change', { roomId, language: newLanguage });
    }
  };

  const handleSaveCode = async () => {
    setIsSaving(true);
    try {
      const response = await api.post('/room/save-code', {
        roomId,
        code,
        language,
      });
      if (response.data.success) {
        toast.success('Code saved successfully!');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to save code';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    // Special case: HTML - render preview in browser instead of using Judge0
    if (language === 'html') {
      setOutput(''); // output not used for HTML; preview is rendered below
      toast.success('HTML rendered in preview!');
      return;
    }

    setIsRunning(true);
    setOutput('Running code...');

    try {
      const response = await api.post('/code/execute-code', {
        code,
        language,
        input: inputValue,
      });

      const resultOutput = response.data.output || 'No output';
      setOutput(resultOutput);
      toast.success('Code executed!');
    } catch (error) {
      const errorMsg = error.response?.data?.output || error.response?.data?.message || 'Execution failed';
      setOutput(errorMsg);
      toast.error('Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyAllCode = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(code || '');
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownloadCurrentCode = () => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    };
    const ext = extensions[language] || 'txt';
    const filename = `room-${roomId}.${ext}`;
    const blob = new Blob([code || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Basic HTML tag suggestions similar to VS Code
    monaco.languages.registerCompletionItemProvider('html', {
      triggerCharacters: ['<', '/'],
      provideCompletionItems: (model, position) => {
        const tags = [
          'html', 'head', 'body',
          'div', 'span', 'p',
          'h1', 'h2', 'h3', 'h4',
          'ul', 'ol', 'li',
          'a', 'button',
          'input', 'label', 'form',
          'section', 'header', 'footer', 'main', 'nav',
          'img'
        ];

        const suggestions = tags.map((tag) => ({
          label: `<${tag}>`,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: `<${tag}>$0</${tag}>`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
        }));

        return { suggestions };
      },
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const message = {
      message: messageInput,
      userName: user.name,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('chat-message', { roomId, ...message });
    setMessageInput('');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!');
  };

  const handleToggleHtmlPreview = () => {
    setIsHtmlPreviewMaximized((prev) => !prev);
  };

  const handleOpenHtmlPreviewInNewTab = () => {
    try {
      const blob = new Blob([code || ''], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast.error('Popup blocked. Allow popups to open preview.');
        return;
      }
      newWindow.focus();
      newWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
    } catch {
      toast.error('Failed to open preview');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark-100">
      {/* Header */}
      <div className="bg-dark-200 border-b border-dark-400 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">CodeCollab</h1>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Room:</span>
            <code className="bg-dark-300 px-3 py-1 rounded text-green-400 font-mono">{roomId}</code>
            <button
              onClick={copyRoomId}
              className="text-gray-400 hover:text-white transition duration-200"
              title="Copy Room ID"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-dark-300 text-white px-3 py-2 rounded-lg border border-dark-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="html">HTML</option>
          </select>

          <button
            onClick={handleSaveCode}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button
            onClick={handleCopyAllCode}
            disabled={isCopying}
            className="px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition duration-200 disabled:opacity-50 text-sm"
          >
            {isCopying ? 'Copying...' : 'Copy'}
          </button>

          <button
            onClick={handleDownloadCurrentCode}
            className="px-3 py-2 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition duration-200 text-sm"
          >
            Download
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col">
          <Editor
            height="70%"
            language={language === 'html' ? 'html' : language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />

          {/* Input + Output Console / HTML Preview */}
          <div className="h-[30%] bg-dark-200 border-t border-dark-400 flex flex-col">
            <div className="px-4 py-2 bg-dark-300 border-b border-dark-400">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">
                  {language === 'html' ? 'HTML Preview' : 'Console'}
                </h3>
                {language === 'html' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenHtmlPreviewInNewTab}
                      className="text-xs px-3 py-1 bg-dark-400 text-white rounded hover:bg-dark-500 transition duration-200"
                    >
                      New Tab
                    </button>
                    <button
                      onClick={handleToggleHtmlPreview}
                      className="text-xs px-3 py-1 bg-dark-400 text-white rounded hover:bg-dark-500 transition duration-200"
                    >
                      {isHtmlPreviewMaximized ? 'Minimize' : 'Expand'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {language !== 'html' && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Input (stdin, optional)</p>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type input that will be passed to your program..."
                    className="w-full h-16 bg-dark-300 text-white px-3 py-2 rounded-lg border border-dark-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>
              )}

              <div className="flex-1 min-h-0">
                <p className="text-xs text-gray-400 mb-1">
                  {language === 'html' ? 'Rendered page' : 'Output'}
                </p>
                <div className="h-full overflow-auto bg-dark-300 rounded-lg border border-dark-400 p-3">
                  {language === 'html' ? (
                    <iframe
                      title="HTML Preview"
                      srcDoc={code}
                      className="w-full h-full bg-white rounded"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap break-words">
                      {output || 'Run code to see output...'}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-dark-200 border-l border-dark-400 flex flex-col">
          {/* Users Section */}
          <div className="p-4 border-b border-dark-400">
            <h3 className="text-white font-semibold mb-3">Connected Users ({users.length})</h3>
            <div className="space-y-2">
              {users.map((userName, index) => (
                <div key={index} className="flex items-center space-x-2 text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{userName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-dark-300 border-b border-dark-400">
              <h3 className="text-white font-semibold">Chat</h3>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-blue-400">{msg.userName}:</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-400">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-dark-300 text-white px-3 py-2 rounded-lg border border-dark-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isHtmlPreviewMaximized && language === 'html' && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold">HTML Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenHtmlPreviewInNewTab}
                  className="px-3 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700 transition duration-200"
                >
                  New Tab
                </button>
                <button
                  onClick={handleToggleHtmlPreview}
                  className="px-3 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700 transition duration-200"
                >
                  Close
                </button>
              </div>
            </div>
            <iframe
              title="HTML Preview Fullscreen"
              srcDoc={code}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingRoom;
