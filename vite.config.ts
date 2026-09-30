import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GH Pages serves under /Twilio-Signal-Builder/ when deployed to
// emarques-tw.github.io/Twilio-Signal-Builder/.
export default defineConfig({
  plugins: [react()],
  base: "/Twilio-Signal-Builder/",
});
