import env from "./config/env.js";
import app from "./app.js";

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server ${env.port}-portda ishga tushdi (${env.nodeEnv})`);
});

// Kutilmagan xatoliklarni tutish
process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
