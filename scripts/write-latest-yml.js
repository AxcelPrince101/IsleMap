const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

function writeLatestYml(versionArg) {
  const root = path.join(__dirname, "..");
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8")
  );
  const version = versionArg || pkg.version;
  if (!version) {
    throw new Error("Usage: node scripts/write-latest-yml.js [version]");
  }

  const exeName = `IsleMap-Setup-${version}.exe`;
  const exePath = path.join(root, "dist", exeName);
  if (!fs.existsSync(exePath)) {
    throw new Error(`Missing ${exePath}`);
  }

  const buf = fs.readFileSync(exePath);
  const sha = crypto.createHash("sha512").update(buf).digest("base64");
  const size = buf.length;
  const yml = [
    `version: ${version}`,
    "files:",
    `  - url: ${exeName}`,
    `    sha512: ${sha}`,
    `    size: ${size}`,
    `path: ${exeName}`,
    `sha512: ${sha}`,
    `releaseDate: '${new Date().toISOString()}'`,
    "",
  ].join("\n");

  const out = path.join(root, "dist", "latest.yml");
  fs.writeFileSync(out, yml, "utf8");
  return { out, yml, version };
}

module.exports = { writeLatestYml };

if (require.main === module) {
  try {
    const { out, yml } = writeLatestYml(process.argv[2]);
    process.stdout.write(yml);
    console.error(`Wrote ${out}`);
  } catch (err) {
    console.error(String(err.message || err));
    process.exit(1);
  }
}
