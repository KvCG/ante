/**
 * Environment validation script
 *
 * Run before starting the application to ensure all required
 * environment variables are configured.
 */
require("dotenv").config();

// Required environment variables (add project-specific vars here)
const REQUIRED_VARS = [
  // 'DATABASE_URL',
  // 'API_KEY',
];

// Optional variables with defaults
const OPTIONAL_DEFAULTS = {
  PORT: "3000",
  NODE_ENV: "development",
  LOG_LEVEL: "info",
};

function validateEnvironment() {
  console.log("Validating environment...\n");

  // Check required variables
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error("\nCopy .env.example to .env and configure these values.\n");
    process.exit(1);
  }

  // Apply defaults for optional variables
  const applied = [];
  for (const [key, val] of Object.entries(OPTIONAL_DEFAULTS)) {
    if (!process.env[key]) {
      process.env[key] = val;
      applied.push(`${key}=${val}`);
    }
  }

  // Report status
  if (REQUIRED_VARS.length > 0) {
    console.log("Required variables:");
    REQUIRED_VARS.forEach((v) => console.log(`   - ${v}: configured`));
    console.log();
  }

  if (applied.length > 0) {
    console.log("Applied defaults:");
    applied.forEach((v) => console.log(`   - ${v}`));
    console.log();
  }

  console.log("Environment validated successfully\n");
}

// Run if executed directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
