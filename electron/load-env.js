const fs = require("fs");
const path = require("path");

/** Load gitignored `.env` into process.env (does not override existing vars). */
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null || process.env[key] === "") {
        process.env[key] = val;
      }
    }
    return true;
  } catch (err) {
    console.warn("[env] failed to load", filePath, err?.message || err);
    return false;
  }
}

function loadProjectEnv() {
  const root = path.join(__dirname, "..");
  return loadEnvFile(path.join(root, ".env"));
}

module.exports = { loadEnvFile, loadProjectEnv };
