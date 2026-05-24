const fs = require("fs");
const path = require("path");

/** Shallow JSON read with a 256 KB cap to stay fast and avoid huge configs. */
function readJsonFile(absolutePath) {
  try {
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile() || stat.size > 256 * 1024) return null;
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

/** Plain-text read with the same 256 KB cap. */
function readTextFile(absolutePath) {
  try {
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile() || stat.size > 256 * 1024) return null;
    return fs.readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Collects lightweight signals from the workspace root. Reads only top-level
 * manifest files; never recurses into the project. Returns lowercased haystacks.
 */
function collectWorkspaceSignals(rootDir) {
  const signals = {
    npmDeps: new Set(),
    npmKeywords: [],
    npmText: "",
    cargoDeps: new Set(),
    pythonText: "",
    goText: "",
    composerText: "",
    files: new Set(),
    extensionCounts: {},
    // Number of top-level *.yaml/*.yml files containing both `apiVersion:` and
    // `kind:` — strong heuristic for Kubernetes / Helm / Kustomize manifests.
    k8sManifestCount: 0,
  };

  if (!rootDir) return signals;

  // package.json
  const pkg = readJsonFile(path.join(rootDir, "package.json"));
  if (pkg && typeof pkg === "object") {
    // Detect if this project is a VS Code extension — its description/keywords
    // are marketing copy and must NOT be used for domain scoring.
    const isVscodeExtension = !!(pkg.engines && pkg.engines.vscode);
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    for (const name of Object.keys(deps)) signals.npmDeps.add(String(name).toLowerCase());
    if (!isVscodeExtension && Array.isArray(pkg.keywords)) {
      signals.npmKeywords = pkg.keywords.map((k) => String(k).toLowerCase());
    }
    if (isVscodeExtension) {
      // Only use the package name — description and keywords are SEO, not domain signals
      signals.npmText = (typeof pkg.name === "string" ? pkg.name : "").toLowerCase();
    } else {
      signals.npmText = [pkg.name, pkg.description, ...(pkg.keywords || [])]
        .filter((v) => typeof v === "string")
        .join(" ")
        .toLowerCase();
    }
  }

  // Cargo.toml
  const cargo = readTextFile(path.join(rootDir, "Cargo.toml"));
  if (cargo) {
    const inDeps = cargo.match(/\[dependencies\][\s\S]*?(?=\n\[|\Z)/);
    const block = inDeps ? inDeps[0] : cargo;
    for (const m of block.matchAll(/^([a-zA-Z0-9_-]+)\s*=/gm)) {
      signals.cargoDeps.add(m[1].toLowerCase());
    }
  }

  // Python: pyproject.toml + requirements.txt
  signals.pythonText =
    [
      readTextFile(path.join(rootDir, "pyproject.toml")) || "",
      readTextFile(path.join(rootDir, "requirements.txt")) || "",
      readTextFile(path.join(rootDir, "Pipfile")) || "",
    ]
      .join("\n")
      .toLowerCase();

  // Go
  signals.goText = (readTextFile(path.join(rootDir, "go.mod")) || "").toLowerCase();

  // PHP / Composer
  const composer = readJsonFile(path.join(rootDir, "composer.json"));
  if (composer) signals.composerText = JSON.stringify(composer).toLowerCase();

  // Top-level file listing (no recursion). YAML files are peeked at to detect
  // K8s manifests inline so we keep the original case for the read path
  // (case-sensitive filesystems would fail with the lowercased name from
  // `signals.files`).
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile()) {
        signals.files.add(e.name.toLowerCase());
        const ext = path.extname(e.name).toLowerCase();
        if (ext) signals.extensionCounts[ext] = (signals.extensionCounts[ext] || 0) + 1;

        if (ext === ".yaml" || ext === ".yml") {
          const text = readTextFile(path.join(rootDir, e.name));
          if (
            text &&
            /^apiVersion\s*:/m.test(text) &&
            /^kind\s*:/m.test(text)
          ) {
            signals.k8sManifestCount += 1;
          }
        }
      } else if (e.isDirectory()) {
        signals.files.add(e.name.toLowerCase() + "/");
      }
    }
  } catch {
    /* permission errors etc. — ignore */
  }

  return signals;
}

/**
 * Pattern set: each entry yields a score for a Dusk Office variant based on
 * collected signals. Higher score = stronger match. Scores are tuned so a
 * meaningful match generally lands ≥ 30, with stacking signals reaching 50–80.
 */
const FINGERPRINT_PATTERNS = [
  {
    variant: "Dusk Office Vault",
    displayLabel: "Vault",
    reason: "fintech, banking, or smart-contract project",
    score(s) {
      let n = 0;
      const fintechDeps = ["stripe", "plaid", "dwolla", "square", "paypal-rest-sdk", "braintree"];
      for (const d of fintechDeps) if (s.npmDeps.has(d)) n += 25;
      // Text/keyword signals only count if there's at least one hard dep or file signal.
      // This prevents marketing descriptions from triggering Vault on unrelated projects.
      const hasHardSignal = n > 0;
      if (hasHardSignal && /\b(fintech|banking|payment|wallet|kyc|aml|treasury)\b/.test(s.npmText)) n += 20;
      if (hasHardSignal && s.npmKeywords.some((k) => /(fintech|banking|payment|wallet)/.test(k))) n += 15;
      // Smart contracts / Web3 — finance-adjacent, the vault metaphor fits.
      const web3Deps = [
        "hardhat",
        "@nomicfoundation/hardhat-toolbox",
        "@nomiclabs/hardhat-ethers",
        "@nomiclabs/hardhat-waffle",
        "ethers",
        "viem",
        "wagmi",
        "web3",
        "@openzeppelin/contracts",
        "@openzeppelin/contracts-upgradeable",
      ];
      for (const d of web3Deps) if (s.npmDeps.has(d)) n += 10;
      if (s.files.has("hardhat.config.js") || s.files.has("hardhat.config.ts")) n += 25;
      if (s.files.has("foundry.toml")) n += 25;
      if (s.files.has("truffle-config.js") || s.files.has("remappings.txt")) n += 12;
      if (s.files.has("contracts/")) n += 8;
      if ((s.extensionCounts[".sol"] || 0) >= 1) n += 18;
      return Math.min(n, 90);
    },
  },
  {
    variant: "Dusk Office Audit",
    displayLabel: "Audit",
    reason: "audit, accounting, or financial compliance project",
    score(s) {
      let n = 0;
      const auditDeps = ["accounting", "quickbooks", "xero-node", "sage-intacct"];
      for (const d of auditDeps) if (s.npmDeps.has(d)) n += 30;
      const hasFileSignal = [...s.files].some((f) => /(audit|accounting|ledger)/.test(f));
      if (hasFileSignal) n += 15;
      // Text signals only count if there's at least one hard dep or file signal.
      const hasHardSignal = n > 0;
      if (hasHardSignal && /\b(audit|accounting|ledger|gaap|ifrs|sox|compliance)\b/.test(s.npmText)) n += 20;
      return Math.min(n, 75);
    },
  },
  {
    variant: "Dusk Office Sentinel",
    displayLabel: "Sentinel",
    reason: "cybersecurity, IaC, or DevSecOps project",
    score(s) {
      let n = 0;
      const secDeps = ["helmet", "passport", "jsonwebtoken", "bcrypt", "node-forge", "crypto-js", "owasp", "snyk"];
      for (const d of secDeps) if (s.npmDeps.has(d)) n += 12;
      if ([...s.files].some((f) => /^(security|auth|firewall|sentinel)\/?$/.test(f))) n += 12;
      // Text signals only amplify when there's already a hard signal (dep or file)
      if (n > 0 && /\b(security|cybersecurity|soc|siem|firewall|vault|falco|osquery|owasp)\b/.test(s.npmText)) n += 18;
      if (s.files.has("dockerfile") && s.files.has("docker-compose.yml") && /\b(vault|consul|falco)\b/.test(s.npmText)) n += 15;
      // Infrastructure-as-Code — Terraform / Pulumi / Ansible. Sentinel owns
      // IaC because it's the security/compliance angle on infra. Terminal
      // still picks up partial signals on pure tooling repos.
      if ((s.extensionCounts[".tf"] || 0) >= 1) n += 18;
      if ((s.extensionCounts[".tfvars"] || 0) >= 1) n += 8;
      if (s.files.has("terragrunt.hcl") || s.files.has("main.tf")) n += 10;
      if (s.files.has("pulumi.yaml") || s.files.has("pulumi.yml")) n += 18;
      if (s.npmDeps.has("@pulumi/pulumi")) n += 15;
      // Ansible — accumulate, since a real Ansible repo usually has several
      // of these markers and a single one shouldn't cross the threshold alone.
      if (s.files.has("ansible.cfg")) n += 18;
      if (s.files.has("playbook.yml") || s.files.has("playbook.yaml")) n += 10;
      if (s.files.has("playbooks/")) n += 8;
      if (s.files.has("roles/")) n += 8;
      if (s.files.has("inventory") || s.files.has("hosts")) n += 6;
      if (s.files.has("group_vars/") || s.files.has("host_vars/")) n += 6;
      if (s.files.has("infra/") || s.files.has("terraform/") || s.files.has("iac/")) n += 8;
      return Math.min(n, 90);
    },
  },
  {
    variant: "Dusk Office Steward",
    displayLabel: "Steward",
    reason: "data science, ML, AI, or LLM project",
    score(s) {
      let n = 0;
      if (/(numpy|pandas|scikit-learn|tensorflow|pytorch|jupyter|fastapi|django|flask)/.test(s.pythonText)) n += 25;
      if (s.files.has("requirements.txt") || s.files.has("pyproject.toml") || s.files.has("pipfile")) n += 15;
      const pyExtCount = (s.extensionCounts[".py"] || 0) + (s.extensionCounts[".ipynb"] || 0);
      if (pyExtCount >= 2) n += 10;
      // AI / LLM stack — JS side. Larger weight than generic Python deps
      // because LLM repos tend to declare these explicitly in package.json.
      const llmJsDeps = [
        "langchain",
        "@langchain/core",
        "@langchain/openai",
        "@langchain/community",
        "openai",
        "@anthropic-ai/sdk",
        "llamaindex",
        "@google/generative-ai",
        "cohere-ai",
        "replicate",
        "ai",
        "@vercel/ai",
        "@mistralai/mistralai",
      ];
      for (const d of llmJsDeps) if (s.npmDeps.has(d)) n += 14;
      // AI / LLM stack — Python side (single regex to avoid capping out fast).
      if (/(langchain|llama-?index|transformers|huggingface|sentence-transformers|chromadb|pinecone|weaviate|qdrant|openai|anthropic|cohere|tiktoken)/.test(s.pythonText)) n += 22;
      if ((s.extensionCounts[".ipynb"] || 0) >= 1) n += 8;
      return Math.min(n, 85);
    },
  },
  {
    variant: "Dusk Office Voltage",
    displayLabel: "Voltage",
    reason: "high-energy modern web stack or monorepo",
    score(s) {
      let n = 0;
      const modernDeps = ["next", "astro", "vite", "remix", "solid-js", "qwik", "hono", "elysia"];
      for (const d of modernDeps) if (s.npmDeps.has(d)) n += 18;
      if (s.files.has("bun.lockb") || s.files.has("deno.json") || s.files.has("deno.jsonc")) n += 25;
      // Monorepo orchestrators — Voltage already targets fast/modern stacks
      // and most of these tools live alongside Next/Vite/Astro repos.
      if (s.files.has("turbo.json")) n += 22;
      if (s.files.has("nx.json")) n += 22;
      if (s.files.has("pnpm-workspace.yaml") || s.files.has("pnpm-workspace.yml")) n += 18;
      if (s.files.has("lerna.json")) n += 15;
      if (s.files.has("rush.json")) n += 15;
      if (s.files.has("apps/") && s.files.has("packages/")) n += 10;
      return Math.min(n, 85);
    },
  },
  {
    variant: "Dusk Office Nocturne",
    displayLabel: "Nocturne",
    reason: "frontend / design-system project",
    score(s) {
      let n = 0;
      const uiDeps = ["react", "vue", "svelte", "tailwindcss", "@storybook/react", "framer-motion", "@radix-ui/react-dialog"];
      for (const d of uiDeps) if (s.npmDeps.has(d)) n += 10;
      if (s.files.has("tailwind.config.js") || s.files.has("tailwind.config.ts") || s.files.has(".storybook/")) n += 15;
      const cssCount = (s.extensionCounts[".css"] || 0) + (s.extensionCounts[".scss"] || 0);
      if (cssCount >= 2) n += 8;
      return Math.min(n, 65);
    },
  },
  {
    variant: "Dusk Office Terminal",
    displayLabel: "Terminal",
    reason: "CLI, Kubernetes, or DevOps tooling project",
    score(s) {
      let n = 0;
      if (s.goText || (s.extensionCounts[".go"] || 0) >= 2) n += 20;
      if (s.cargoDeps.size > 0 && (s.cargoDeps.has("clap") || s.cargoDeps.has("structopt"))) n += 25;
      if ([...s.files].some((f) => f.endsWith(".tf") || f.endsWith(".tfvars"))) n += 10;
      if (s.files.has("makefile") || s.files.has("dockerfile") || s.files.has("docker-compose.yml")) n += 8;
      // Kubernetes / Helm / Kustomize. Helm Chart.yaml is the strongest
      // signal, kustomization.yaml a close second.
      if (s.files.has("chart.yaml")) n += 25;
      if (s.files.has("kustomization.yaml") || s.files.has("kustomization.yml")) n += 22;
      if (s.files.has("values.yaml")) n += 8;
      if (
        s.files.has("helm/") ||
        s.files.has("charts/") ||
        s.files.has("k8s/") ||
        s.files.has("kubernetes/") ||
        s.files.has("manifests/")
      ) n += 12;
      if (s.k8sManifestCount >= 1) n += 10;
      if (s.k8sManifestCount >= 3) n += 8;
      // Local K8s dev tooling.
      if (s.files.has("skaffold.yaml") || s.files.has("tiltfile")) n += 8;
      return Math.min(n, 85);
    },
  },
];

const FINGERPRINT_THRESHOLD = 30;

module.exports = {
  collectWorkspaceSignals,
  FINGERPRINT_PATTERNS,
  FINGERPRINT_THRESHOLD,
};
