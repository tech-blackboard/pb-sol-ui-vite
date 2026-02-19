import { execSync } from "child_process";

try {
  console.log("🔍 Running lint...");
  execSync("npm run lint", { stdio: "inherit" });
} catch {
  process.exit(1);
}
