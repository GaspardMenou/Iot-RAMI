import dotenv from "dotenv";

dotenv.config();

import MqttFog from "./mqttFog";


async function main() {
  console.log("🚀 [FogService] Démarrage...");
  await MqttFog.getInstance();
  console.log("✅ [FogService] Service démarré");
}

main().catch((error) => {
  console.error("❌ [FogService] Erreur fatale:", error);
  process.exit(1);
});
