/**
 * After electron-builder publish races (422 tag exists), upload installer + latest.yml.
 * Usage: node scripts/finish-github-release.js [version]
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { writeLatestYml } = require("./write-latest-yml");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8")
);
const version = process.argv[2] || pkg.version;
const tag = `v${version}`;
const exe = path.join(root, "dist", `IsleMap-Setup-${version}.exe`);

if (!fs.existsSync(exe)) {
  console.error(`Missing ${exe}`);
  process.exit(1);
}

const { out: yml, yml: ymlText } = writeLatestYml(version);
if (!ymlText.includes(`version: ${version}`)) {
  console.error(`latest.yml does not match version ${version}`);
  process.exit(1);
}

function gh(args) {
  execFileSync("gh", args, { stdio: "inherit", cwd: root, shell: true });
}

try {
  execFileSync("gh", ["release", "view", tag], {
    stdio: "pipe",
    cwd: root,
    shell: true,
  });
} catch {
  gh([
    "release",
    "create",
    tag,
    "--title",
    version,
    "--notes",
    `IsleMap ${version}`,
  ]);
}

gh(["release", "upload", tag, exe, yml, "--clobber"]);
console.log(`Uploaded ${path.basename(exe)} and latest.yml to ${tag}`);
