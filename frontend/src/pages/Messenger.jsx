// frontend/src/pages/Messenger.jsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";
const socket = io(SOCKET_URL);

/**
 * All-in-one polished Telegram-style Messenger component.
 * - Everything (styles + logic) is contained in this file.
 * - Sidebar with contacts & profile.
 * - Profile drawer (slide-in from left, 25% width, full height).
 * - Chat area with message bubbles, images, files, audio playback.
 * - Input bar with file attach, voice record, send.
 * - Avatar upload (local preview via Object URL).
 * - Multiple chats (simple demo contacts, switching).
 *
 * Drop this file into frontend/src/pages/ and import in your routes.
 */

function uid() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export default function Messenger() {
  // --- state
  const [user, setUser] = useState({
    id: "me",
    name: "You",
    avatar: "https://i.pravatar.cc/150?img=5",
  });

  const demoContacts = [
    { id: "dad", name: "Dad", avatar: "https://i.pravatar.cc/150?img=10" },
    { id: "mom", name: "Mom", avatar: "https://i.pravatar.cc/150?img=11" },
    { id: "sara", name: "Sara", avatar: "https://i.pravatar.cc/150?img=12" },
  ];
  

  // Map of chatId => messages[]
  const [chats, setChats] = useState(() => {
    // initial demo messages in the "family" chat
    const familyId = "family";
    const initial = {
      family: [
        {
          id: uid(),
          chatId: familyId,
          sender: { id: "dad", name: "Dad", avatar: demoContacts[0].avatar },
          type: "text",
          content: "Don’t forget dinner at 7 🍲",
          ts: new Date().toISOString(),
        },
        {
          id: uid(),
          chatId: familyId,
          sender: { id: "mom", name: "Mom", avatar: demoContacts[1].avatar },
          type: "text",
          content: "Sure ❤️",
          ts: new Date().toISOString(),
        },
      ],
    };
    // create one chat per contact
    demoContacts.forEach((c) => {
      initial[c.id] = [
        {
          id: uid(),
          chatId: c.id,
          sender: c,
          type: "text",
          content: `Hi, this is ${c.name}.`,
          ts: new Date().toISOString(),
        },
      ];
    });
    return initial;
  });

  const [activeChatId, setActiveChatId] = useState("family");
  const [input, setInput] = useState("");
  const [attachFile, setAttachFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [contacts] = useState(demoContacts);

  const messagesRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- socket listeners
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setChats((prev) => {
        const next = { ...prev };
        const arr = next[msg.chatId] ? [...next[msg.chatId], msg] : [msg];
        next[msg.chatId] = arr;
        return next;
      });
      // scroll after small delay
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    });

    return () => {
      socket.off("receiveMessage");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll to bottom when active chat or chats change
  useEffect(() => {
    setTimeout(() => scrollToBottom(), 50);
  }, [activeChatId, chats]);

  function scrollToBottom() {
    if (!messagesRef.current) return;
    const el = messagesRef.current;
    el.scrollTop = el.scrollHeight;
  }

  // --- send message helpers
  function buildTextMessage(text) {
    return {
      id: uid(),
      chatId: activeChatId,
      sender: user,
      type: "text",
      content: text,
      ts: new Date().toISOString(),
    };
  }

  function buildFileMessage(file) {
    const url = URL.createObjectURL(file);
    const type = file.type || "";
    const isImage = type.startsWith("image/");
    return {
      id: uid(),
      chatId: activeChatId,
      sender: user,
      type: isImage ? "image" : "file",
      content: url,
      fileName: file.name,
      fileType: file.type,
      ts: new Date().toISOString(),
    };
  }

  function sendMessage() {
    if (!input.trim() && !attachFile) return;

    let msg;
    if (attachFile) {
      msg = buildFileMessage(attachFile);
    } else {
      msg = buildTextMessage(input.trim());
    }

    // optimistic update locally
    setChats((prev) => {
      const next = { ...prev };
      next[activeChatId] = prev[activeChatId] ? [...prev[activeChatId], msg] : [msg];
      return next;
    });

    // Emit to server
    socket.emit("sendMessage", msg);

    // clear inputs
    setInput("");
    setAttachFile(null);
    // scroll
    setTimeout(() => scrollToBottom(), 50);
  }

  // --- file attach handlers
  function onAttachChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setAttachFile(f);
  }

  function removeAttachment() {
    setAttachFile(null);
  }

  // --- voice recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => audioChunksRef.current.push(ev.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        const msg = {
          ...buildFileMessage(file),
          type: "audio",
        };
        // local update + emit
        setChats((prev) => {
          const next = { ...prev };
          next[activeChatId] = prev[activeChatId] ? [...prev[activeChatId], msg] : [msg];
          return next;
        });
        socket.emit("sendMessage", msg);
        setTimeout(() => scrollToBottom(), 50);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic access denied or error:", err);
      alert("Unable to access microphone.");
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  }

  // --- profile avatar upload
  function onAvatarFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatarPreview({ file: f, url });
  }

  function saveProfile() {
    if (avatarPreview && avatarPreview.url) {
      setUser((p) => ({ ...p, avatar: avatarPreview.url }));
      setAvatarPreview(null);
    }
    setProfileOpen(false);
  }

  function cancelProfile() {
    setAvatarPreview(null);
    setProfileOpen(false);
  }

  // --- chat switching
  function openChat(chatId) {
    setActiveChatId(chatId);
  }

  // --- helpers for rendering
  function renderMessage(msg) {
    const mine = msg.sender?.id === user.id || msg.sender?.name === user.name;
    const time = new Date(msg.ts).toLocaleTimeString();
    return (
      <div
        key={msg.id}
        style={{
          display: "flex",
          alignItems: "flex-start",
          marginBottom: 12,
          maxWidth: "80%",
          marginLeft: mine ? "auto" : undefined,
          flexDirection: mine ? "row-reverse" : "row",
        }}
      >
        <img
          src={msg.sender.avatar}
          alt="av"
          style={{
            width: 40,
            height: 40,
            objectFit: "cover",
            borderRadius: "50%",
            margin: "0 8px",
            border: "2px solid rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            background: mine ? "#2d9cdb" : "rgba(30,30,30,0.85)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 12,
            textAlign: mine ? "right" : "left",
            boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>{msg.sender.name}</div>

          <div style={{ marginTop: 6 }}>
            {msg.type === "text" && <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>}

            {msg.type === "image" && (
              <img
                src={msg.content}
                alt="img"
                style={{ maxWidth: 320, borderRadius: 8, display: "block" }}
              />
            )}

            {msg.type === "file" && msg.fileName && (
              <a
                href={msg.content}
                download={msg.fileName}
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                📎 {msg.fileName}
              </a>
            )}

            {msg.type === "audio" && (
              <audio controls src={msg.content} style={{ marginTop: 6 }} />
            )}
          </div>

          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 8 }}>{time}</div>
        </div>
      </div>
    );
  }

  // inline styles (single place)
  const styles = {
    root: {
      display: "flex",
      height: "100vh",
      fontFamily: "'Segoe UI', Roboto, system-ui, -apple-system, 'Helvetica Neue', Arial",
      background: "linear-gradient(180deg,#0f1720 0%, #111827 100%)",
      color: "#fff",
      overflow: "hidden",
    },
    sidebar: {
      width: 260,
      background: "linear-gradient(180deg,#0b1220,#0e1724)",
      borderRight: "1px solid rgba(255,255,255,0.03)",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    profileBox: { textAlign: "center" },
    profileAvatar: {
      width: 72,
      height: 72,
      borderRadius: "50%",
      objectFit: "cover",
      border: "3px solid rgba(255,255,255,0.06)",
    },
    smallBtn: {
      marginTop: 8,
      padding: "6px 10px",
      borderRadius: 8,
      border: "none",
      background: "#2d9cdb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 13,
    },
    contactsList: { marginTop: 6, overflowY: "auto", flex: 1 },
    contactItem: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 6px",
      borderRadius: 8,
      cursor: "pointer",
      background: active ? "rgba(255,255,255,0.04)" : "transparent",
      marginBottom: 6,
    }),
    contactAvatar: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover" },
    chatArea: { flex: 1, display: "flex", flexDirection: "column" },
    header: {
      padding: "12px 18px",
      borderBottom: "1px solid rgba(255,255,255,0.03)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "linear-gradient(90deg, rgba(255,255,255,0.01), transparent)",
    },
    messagesWrap: { flex: 1, overflowY: "auto", padding: 18, background: "linear-gradient(#07101888, transparent)" },
    inputBar: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      padding: 12,
      borderTop: "1px solid rgba(255,255,255,0.03)",
      background: "linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.05))",
    },
    textInput: {
      flex: 1,
      padding: "10px 14px",
      borderRadius: 22,
      border: "none",
      outline: "none",
      fontSize: 14,
      background: "rgba(255,255,255,0.03)",
      color: "#fff",
    },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 12,
      border: "none",
      background: "rgba(255,255,255,0.03)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#fff",
      fontSize: 18,
    },
    attachPreview: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: 10,
      background: "rgba(255,255,255,0.03)",
      borderRadius: 10,
      margin: "8px 12px",
    },
    profileDrawer: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "26%",
      minWidth: 260,
      height: "100vh",
      background: "linear-gradient(180deg,#0b1220,#0d1722)",
      borderRight: "1px solid rgba(255,255,255,0.03)",
      zIndex: 9999,
      padding: 20,
      display: "flex",
      flexDirection: "column",
    },
    drawerActions: { marginTop: "auto", display: "flex", gap: 10 },
    smallInput: { padding: "8px 10px", borderRadius: 8, border: "none", outline: "none" },
  };

  // render active chat header
  const activeChatTitle = activeChatId === "family" ? "Family Chat" : (contacts.find(c => c.id === activeChatId)?.name || activeChatId);

  return (
    <div style={styles.root}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.profileBox}>
          <img src={user.avatar} alt="avatar" style={styles.profileAvatar} />
          <div style={{ marginTop: 10, fontWeight: 700 }}>{user.name}</div>
          <button style={styles.smallBtn} onClick={() => setProfileOpen(true)}>Edit Profile</button>
        </div>

        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>Chats</div>

        <div style={styles.contactsList}>
          <div
            style={styles.contactItem(activeChatId === "family")}
            onClick={() => openChat("family")}
          >
            <img src="https://i.pravatar.cc/150?img=20" style={styles.contactAvatar} alt="family" />
            <div>
              <div style={{ fontWeight: 700 }}>Family</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Group chat</div>
            </div>
          </div>

          {contacts.map((c) => (
            <div
              key={c.id}
              style={styles.contactItem(activeChatId === c.id)}
              onClick={() => openChat(c.id)}
            >
              <img src={c.avatar} alt={c.name} style={styles.contactAvatar} />
              <div>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Tap to open</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          Tip: open multiple tabs to test real-time.
        </div>
      </aside>

      {/* CHAT AREA */}
      <div style={styles.chatArea}>
        <div style={styles.header}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{activeChatTitle}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{activeChatId}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={{ ...styles.iconBtn, background: "linear-gradient(90deg,#2d9cdb,#3fb0e8)" }}
              onClick={() => window.location.reload()}
              title="Reload"
            >
              ↻
            </button>
            <button style={styles.iconBtn} onClick={() => { /* future: open settings */ }}>
              ⚙
            </button>
          </div>
        </div>

        <div style={styles.messagesWrap} ref={messagesRef}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(chats[activeChatId] || []).map((m) => renderMessage(m))}
          </div>
        </div>

        {/* attachment preview row */}
        {attachFile && (
          <div style={styles.attachPreview}>
            {attachFile.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(attachFile)} alt="preview" style={{ width: 80, borderRadius: 8 }} />
            ) : (
              <div style={{ fontWeight: 700 }}>{attachFile.name}</div>
            )}
            <div style={{ marginLeft: "auto" }}>
              <button onClick={removeAttachment} style={{ ...styles.iconBtn, borderRadius: 8 }}>✖</button>
            </div>
          </div>
        )}

        <div style={styles.inputBar}>
          <input
            aria-label="message"
            placeholder="Write a message..."
            style={styles.textInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          {/* hidden file input */}
          <input id="attachFile" type="file" style={{ display: "none" }} onChange={onAttachChange} />
          <label htmlFor="attachFile" style={{ ...styles.iconBtn, cursor: "pointer" }} title="Attach file">📎</label>

          {!recording ? (
            <button style={styles.iconBtn} onClick={startRecording} title="Record voice">🎤</button>
          ) : (
            <button style={{ ...styles.iconBtn, background: "crimson" }} onClick={stopRecording} title="Stop recording">⏹</button>
          )}

          <button
            onClick={sendMessage}
            style={{
              ...styles.iconBtn,
              background: "linear-gradient(90deg,#2d9cdb,#1f8ecf)",
              width: 56,
              height: 44,
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
            }}
            title="Send"
          >
            ➤
          </button>
        </div>
      </div>

      {/* PROFILE DRAWER (slide-in) */}
      {profileOpen && (
        <div style={styles.profileDrawer}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, color: "#2d9cdb" }}>Edit Profile</h3>
            <button onClick={cancelProfile} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20 }}>✖</button>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Avatar</div>
            <div style={{ marginTop: 10 }}>
              <img
                src={avatarPreview?.url || user.avatar}
                alt="preview"
                style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.06)" }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <input type="file" accept="image/*" onChange={onAvatarFile} style={{ display: "block" }} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Name</div>
            <input
              value={user.name}
              onChange={(e) => setUser((p) => ({ ...p, name: e.target.value }))}
              style={{ ...styles.smallInput, marginTop: 8, width: "100%" }}
            />
          </div>

          <div style={styles.drawerActions}>
            <button onClick={saveProfile} style={{ ...styles.smallBtn, background: "#2d9cdb" }}>Save</button>
            <button onClick={cancelProfile} style={{ ...styles.smallBtn, background: "#444" }}>Cancel</button>
          </div>

          <div style={{ marginTop: 24, fontSize: 12, opacity: 0.8 }}>
            Tip: avatar and name are stored in memory (for now). You can extend this to save on server/db.
          </div>
        </div>
      )}
    </div>
  );
}
