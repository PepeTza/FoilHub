// Carga backend/.env en desarrollo. En Docker/Swarm no existe y no hace nada.
// Debe importarse antes que cualquier otro módulo en los puntos de entrada (main.ts, cli/*).
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables del entorno.
}
