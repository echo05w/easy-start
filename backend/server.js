io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("chat message", (msg) => {
    // Broadcast to everyone
    io.emit("chat message", msg);

    // --- Auntie Luna bot replies ---
    if (msg.user !== "Auntie Luna") {
      let reply = null;

      if (msg.text.toLowerCase().includes("tired")) {
        reply = "Sweetie, don’t forget to rest 🌙💤";
      } else if (msg.text.toLowerCase().includes("love")) {
        reply = "I love you too, my dear 💙";
      } else if (msg.text.toLowerCase().includes("school")) {
        reply = "Good luck at school tomorrow 📚✨";
      } else if (msg.text.toLowerCase().includes("dinner")) {
        reply = "Don’t skip meals, eat well 🍲❤️";
      }

      if (reply) {
        setTimeout(() => {
          io.emit("chat message", {
            user: "Auntie Luna",
            text: reply,
          });
        }, 1000); // delay to feel natural
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});
