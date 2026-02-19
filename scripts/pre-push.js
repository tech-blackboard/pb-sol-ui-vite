import { execSync } from "child_process";

function run(cmd) {
  try {
    console.log(`▶ ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
  } catch {
    process.exit(1);
  }
}

console.log("🚨 PRE-PUSH HOOK RUNNING");

run("npm run lint");
run("npm run test");

process.exit(1);
