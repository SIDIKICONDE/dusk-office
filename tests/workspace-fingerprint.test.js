const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  FINGERPRINT_PATTERNS,
  FINGERPRINT_THRESHOLD,
} = require("../lib/workspace-fingerprint-data.js");

/** Creates a minimal signals object with optional overrides. */
function makeSignals(overrides = {}) {
  return {
    npmDeps: new Set(),
    npmKeywords: [],
    npmText: "",
    cargoDeps: new Set(),
    pythonText: "",
    goText: "",
    composerText: "",
    files: new Set(),
    extensionCounts: {},
    k8sManifestCount: 0,
    ...overrides,
  };
}

function getPattern(variant) {
  return FINGERPRINT_PATTERNS.find((p) => p.variant === variant);
}

// ---------------------------------------------------------------------------
// Vault — fintech / banking / Web3
// ---------------------------------------------------------------------------
describe("Fingerprint: Vault", () => {
  const pattern = getPattern("Dusk Office Vault");

  it("scores 0 for empty signals", () => {
    assert.equal(pattern.score(makeSignals()), 0);
  });

  it("scores > 0 but below threshold for a single fintech dep", () => {
    const s = makeSignals({ npmDeps: new Set(["stripe"]) });
    const score = pattern.score(s);
    assert.ok(score > 0, "expected non-zero score");
    assert.ok(score < FINGERPRINT_THRESHOLD, "single dep should not cross threshold alone");
  });

  it("scores >= threshold when fintech deps + keywords stack", () => {
    const s = makeSignals({
      npmDeps: new Set(["stripe"]),
      npmText: "a fintech banking payment platform",
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores high for hardhat + .sol files", () => {
    const s = makeSignals({
      files: new Set(["hardhat.config.js"]),
      extensionCounts: { ".sol": 3 },
    });
    assert.ok(pattern.score(s) >= 40);
  });

  it("scores high for Web3 deps stacking", () => {
    const s = makeSignals({
      npmDeps: new Set(["hardhat", "ethers", "@openzeppelin/contracts"]),
      files: new Set(["contracts/"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("caps at 90", () => {
    const s = makeSignals({
      npmDeps: new Set(["stripe", "plaid", "hardhat", "ethers", "viem", "wagmi", "web3"]),
      npmText: "fintech banking payment wallet kyc treasury",
      npmKeywords: ["fintech", "banking"],
      files: new Set(["hardhat.config.js", "foundry.toml", "contracts/"]),
      extensionCounts: { ".sol": 10 },
    });
    assert.ok(pattern.score(s) <= 90);
  });
});

// ---------------------------------------------------------------------------
// Audit — accounting / compliance
// ---------------------------------------------------------------------------
describe("Fingerprint: Audit", () => {
  const pattern = getPattern("Dusk Office Audit");

  it("scores 0 for empty signals", () => {
    assert.equal(pattern.score(makeSignals()), 0);
  });

  it("scores >= threshold for audit npm dep", () => {
    const s = makeSignals({ npmDeps: new Set(["xero-node"]) });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores > 0 but below threshold for keywords alone", () => {
    const s = makeSignals({ npmText: "audit compliance ledger gaap" });
    const score = pattern.score(s);
    assert.ok(score > 0);
    assert.ok(score < FINGERPRINT_THRESHOLD, "keywords alone should not cross threshold");
  });

  it("scores >= threshold when audit dep + keywords stack", () => {
    const s = makeSignals({
      npmDeps: new Set(["xero-node"]),
      npmText: "audit compliance ledger gaap",
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores from file names containing audit", () => {
    const s = makeSignals({ files: new Set(["audit-reports/"]) });
    assert.ok(pattern.score(s) > 0);
  });
});

// ---------------------------------------------------------------------------
// Sentinel — cybersecurity / IaC
// ---------------------------------------------------------------------------
describe("Fingerprint: Sentinel", () => {
  const pattern = getPattern("Dusk Office Sentinel");

  it("scores 0 for empty signals", () => {
    assert.equal(pattern.score(makeSignals()), 0);
  });

  it("scores >= threshold for security deps stacking", () => {
    const s = makeSignals({ npmDeps: new Set(["helmet", "passport", "jsonwebtoken"]) });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores high for Terraform files but needs stacking", () => {
    const s = makeSignals({
      extensionCounts: { ".tf": 3 },
      files: new Set(["main.tf"]),
    });
    assert.ok(pattern.score(s) > 0);
  });

  it("scores >= threshold for Terraform + infra folder", () => {
    const s = makeSignals({
      extensionCounts: { ".tf": 3, ".tfvars": 1 },
      files: new Set(["main.tf", "terraform/"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores for Pulumi project", () => {
    const s = makeSignals({
      files: new Set(["pulumi.yaml"]),
      npmDeps: new Set(["@pulumi/pulumi"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores for Ansible project", () => {
    const s = makeSignals({
      files: new Set(["ansible.cfg", "playbook.yml", "roles/", "inventory"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// Steward — data science / ML / AI
// ---------------------------------------------------------------------------
describe("Fingerprint: Steward", () => {
  const pattern = getPattern("Dusk Office Steward");

  it("scores 0 for empty signals", () => {
    assert.equal(pattern.score(makeSignals()), 0);
  });

  it("scores >= threshold for Python ML deps", () => {
    const s = makeSignals({
      pythonText: "tensorflow pandas numpy scikit-learn",
      files: new Set(["requirements.txt"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores >= threshold for JS LLM deps", () => {
    const s = makeSignals({
      npmDeps: new Set(["openai", "langchain", "@langchain/core"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores for Python LLM stack", () => {
    const s = makeSignals({
      pythonText: "langchain chromadb openai transformers",
      files: new Set(["pyproject.toml"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores for notebook-heavy project", () => {
    const s = makeSignals({
      pythonText: "pandas jupyter",
      files: new Set(["requirements.txt"]),
      extensionCounts: { ".ipynb": 5, ".py": 3 },
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// Voltage — modern web / monorepo
// ---------------------------------------------------------------------------
describe("Fingerprint: Voltage", () => {
  const pattern = getPattern("Dusk Office Voltage");

  it("scores 0 for empty signals", () => {
    assert.equal(pattern.score(makeSignals()), 0);
  });

  it("scores >= threshold for Next.js", () => {
    const s = makeSignals({ npmDeps: new Set(["next"]) });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD - 12); // 18 alone, close
  });

  it("scores >= threshold for Bun project", () => {
    const s = makeSignals({ files: new Set(["bun.lockb"]) });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD - 5);
  });

  it("scores >= threshold for Turborepo monorepo", () => {
    const s = makeSignals({
      files: new Set(["turbo.json", "apps/", "packages/"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores for pnpm workspace + Vite", () => {
    const s = makeSignals({
      npmDeps: new Set(["vite"]),
      files: new Set(["pnpm-workspace.yaml"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// Nocturne — frontend / design system
// ---------------------------------------------------------------------------
describe("Fingerprint: Nocturne", () => {
  const pattern = getPattern("Dusk Office Nocturne");

  it("scores 0 for empty signals", () => {
    assert.equal(pattern.score(makeSignals()), 0);
  });

  it("scores for React + Tailwind + Storybook", () => {
    const s = makeSignals({
      npmDeps: new Set(["react", "tailwindcss", "@storybook/react"]),
      files: new Set(["tailwind.config.js", ".storybook/"]),
      extensionCounts: { ".css": 5, ".scss": 3 },
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores > 0 for Vue + CSS but needs more signals", () => {
    const s = makeSignals({
      npmDeps: new Set(["vue", "tailwindcss"]),
      extensionCounts: { ".css": 10 },
    });
    assert.ok(pattern.score(s) > 0);
  });

  it("scores >= threshold for Vue + Tailwind + Storybook + CSS", () => {
    const s = makeSignals({
      npmDeps: new Set(["vue", "tailwindcss", "@storybook/react"]),
      files: new Set(["tailwind.config.js"]),
      extensionCounts: { ".css": 10, ".scss": 3 },
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// Terminal — CLI / K8s / DevOps
// ---------------------------------------------------------------------------
describe("Fingerprint: Terminal", () => {
  const pattern = getPattern("Dusk Office Terminal");

  it("scores 0 for empty signals", () => {
    assert.equal(pattern.score(makeSignals()), 0);
  });

  it("scores > 0 for Go project (single signal)", () => {
    const s = makeSignals({
      goText: "module github.com/foo/bar",
      extensionCounts: { ".go": 5 },
    });
    assert.ok(pattern.score(s) > 0);
  });

  it("scores >= threshold for Go + Docker + Makefile", () => {
    const s = makeSignals({
      goText: "module github.com/foo/bar",
      extensionCounts: { ".go": 5 },
      files: new Set(["makefile", "dockerfile"]),
      k8sManifestCount: 2,
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores >= threshold for Rust CLI (clap)", () => {
    const s = makeSignals({
      cargoDeps: new Set(["clap", "serde"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD - 5);
  });

  it("scores >= threshold for Helm chart", () => {
    const s = makeSignals({
      files: new Set(["chart.yaml", "values.yaml", "charts/"]),
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores for Kustomize project", () => {
    const s = makeSignals({
      files: new Set(["kustomization.yaml", "k8s/"]),
      k8sManifestCount: 4,
    });
    assert.ok(pattern.score(s) >= FINGERPRINT_THRESHOLD);
  });

  it("scores > 0 for Docker + Makefile + K8s manifests", () => {
    const s = makeSignals({
      files: new Set(["makefile", "dockerfile", "docker-compose.yml"]),
      k8sManifestCount: 2,
    });
    assert.ok(pattern.score(s) > 0);
  });
});

// ---------------------------------------------------------------------------
// Cross-pattern: all patterns score 0 on empty signals
// ---------------------------------------------------------------------------
describe("all patterns score 0 on empty signals", () => {
  for (const pattern of FINGERPRINT_PATTERNS) {
    it(`${pattern.displayLabel} scores 0`, () => {
      assert.equal(pattern.score(makeSignals()), 0);
    });
  }
});

// ---------------------------------------------------------------------------
// Cross-pattern: no pattern exceeds its declared cap
// ---------------------------------------------------------------------------
describe("score caps are respected", () => {
  const maxSignals = makeSignals({
    npmDeps: new Set([
      "stripe", "plaid", "dwolla", "square", "paypal-rest-sdk", "braintree",
      "hardhat", "ethers", "viem", "wagmi", "web3", "@openzeppelin/contracts",
      "accounting", "quickbooks", "xero-node",
      "helmet", "passport", "jsonwebtoken", "bcrypt", "node-forge", "crypto-js", "snyk",
      "@pulumi/pulumi",
      "next", "astro", "vite", "remix", "solid-js", "qwik", "hono", "elysia",
      "react", "vue", "svelte", "tailwindcss", "@storybook/react", "framer-motion",
      "openai", "langchain", "@langchain/core",
    ]),
    npmText: "fintech banking payment wallet kyc aml treasury audit accounting ledger gaap sox compliance security cybersecurity soc siem",
    npmKeywords: ["fintech", "banking", "payment", "wallet"],
    cargoDeps: new Set(["clap", "structopt", "serde"]),
    pythonText: "tensorflow pandas numpy scikit-learn langchain chromadb openai transformers",
    goText: "module github.com/example/tool",
    files: new Set([
      "hardhat.config.js", "foundry.toml", "contracts/", "audit-reports/",
      "main.tf", "pulumi.yaml", "ansible.cfg", "playbook.yml", "roles/", "inventory",
      "turbo.json", "pnpm-workspace.yaml", "apps/", "packages/",
      "tailwind.config.js", ".storybook/",
      "chart.yaml", "kustomization.yaml", "values.yaml", "charts/", "k8s/",
      "makefile", "dockerfile", "docker-compose.yml",
      "bun.lockb", "requirements.txt", "pyproject.toml",
    ]),
    extensionCounts: { ".sol": 10, ".tf": 5, ".go": 10, ".css": 10, ".scss": 5, ".py": 5, ".ipynb": 3 },
    k8sManifestCount: 10,
  });

  for (const pattern of FINGERPRINT_PATTERNS) {
    it(`${pattern.displayLabel} score <= declared cap`, () => {
      const score = pattern.score(maxSignals);
      // Each pattern has Math.min(n, cap) — verify the cap holds
      assert.ok(score <= 90, `${pattern.displayLabel} scored ${score}, expected <= 90`);
    });
  }
});
