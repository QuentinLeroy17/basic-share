const [major, minor, patch] = process.versions.node.split('.').map(Number);
if (
  major < 20 ||
  (major === 20 && (minor < 19 || (minor === 19 && patch < 0)))
) {
  console.error(`Node >=20.19.0 is required. Current version: ${process.versions.node}`);
  process.exit(1);
}
