/**
 * Built-in Pusher Channels credentials for IsleMap Group.
 * Loaded only in the Electron main process (never exposed to the renderer).
 *
 * Key/cluster are public by design. Secret is used for presence auth inside
 * main so packaged installs work without a separate auth server.
 * Override anytime with .env or Group → Advanced.
 */
module.exports = Object.freeze({
  appId: "2184426",
  key: "5cb9e5c6bed8dddca552",
  secret: "a3c0437f4d6e4accd7a8",
  cluster: "ap1",
  // Empty = use main-process secret auth (no localhost dependency)
  authEndpoint: "",
});
