const { createClient } = require("redis");

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  username: "default",
  password: process.env.REDIS_PASSWORD,
});

client.on("connect", () => console.log("✅ Redis Connected Successfully"));
client.on("error", (err) => console.error("❌ Redis Client Error:", err));

function connectRedis() {
  client.connect().catch((err) => {
    console.error("❌ Redis Connection Error:", err);
  });
}
module.exports = {connectRedis, client };