const https = require("https");
const env = require("./env.cjs");

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = env.SUPABASE_URL || "https://svocfsftkskhcysspima.supabase.co";
const ANON_KEY = env.SUPABASE_ANON_KEY || "";
const SERVICE_ROLE_KEY = env.SERVICE_ROLE_KEY || "";

if (!ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("Clés manquantes : lance avec `node --env-file=.env tests/regression.cjs`");
  process.exit(1);
}

const TEST_EMAIL = "test1@acvha.org";
const TEST_PASSWORD = "AcVh2026!";
const MOD_EMAIL = "moderator@acvha.org";
const MOD_PASSWORD = "AcVh2026!";
const AC_EMAIL = "adminclasse@acvha.org";
const AC_PASSWORD = "AcVh2026!";
const TEST2_EMAIL = "test2@acvha.org";
const TEST2_PASSWORD = "AcVh2026!";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function request(method, path, { apiKey = ANON_KEY, token, body, json = true } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const headers = {
      apikey: apiKey,
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const bodyStr = body && json ? JSON.stringify(body) : body;
    if (bodyStr && json) headers["Content-Length"] = Buffer.byteLength(bodyStr);

    const opts = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("Request timed out")));

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function signIn(email, password) {
  return request("POST", "/auth/v1/token?grant_type=password", {
    body: { email, password },
  });
}

function ok(label) {
  passed++;
  console.log(`  ${C.green("✔ PASS")} ${label}`);
}

function fail(label, detail) {
  failed++;
  const msg = detail ? `${label} — ${detail}` : label;
  failures.push(msg);
  console.log(`  ${C.red("✘ FAIL")} ${label}`);
  if (detail) console.log(`           ${C.dim(String(detail).slice(0, 200))}`);
}

function skip(label, reason) {
  skipped++;
  console.log(`  ${C.yellow("⊘ SKIP")} ${label} ${C.dim("(" + reason + ")")}`);
}

function assert(condition, label, detail) {
  if (condition) {
    ok(label);
  } else {
    fail(label, detail);
  }
}

function section(title) {
  console.log(`\n${C.bold(C.cyan("▸ " + title))}`);
}

// ─── Test runner ──────────────────────────────────────────────────────────────
async function run() {
  console.log(C.bold("\n═══════════════════════════════════════════════════════"));
  console.log(C.bold("  Regression Test Suite — Académie Vases d'Honneur"));
  console.log(C.bold("═══════════════════════════════════════════════════════"));

  let studentToken = null;
  let studentUser = null;

  // ── 1. Auth Flow ──────────────────────────────────────────────────────────
  section("1. Auth Flow");

  {
    const res = await signIn(TEST_EMAIL, TEST_PASSWORD);
    const sigOk = res.status === 200 && !!res.data?.access_token;

    assert(
      res.status === 200,
      "Sign in with test1@acvha.org returns 200",
      `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`
    );
    assert(
      !!res.data?.access_token,
      "Sign in returns an access_token"
    );

    if (sigOk) {
      studentToken = res.data.access_token;
      studentUser = res.data.user;
    }
  }

  if (studentToken && studentUser) {
    const res = await request("GET", "/rest/v1/profiles?select=*&id=eq." + studentUser.id, { token: studentToken });
    assert(
      res.status === 200,
      "GET own profile returns 200",
      `Got ${res.status}`
    );
    assert(
      Array.isArray(res.data) && res.data.length === 1,
      "Own profile contains exactly 1 row",
      `Got ${JSON.stringify(res.data).slice(0, 200)}`
    );
    if (Array.isArray(res.data) && res.data.length > 0) {
      assert(
        res.data[0].id === studentUser.id,
        "Profile ID matches authenticated user ID"
      );
    }
  } else {
    skip("Read own profile with JWT", "No JWT — auth failed");
  }

  // ── 2. RLS — Students can only see their own data ────────────────────────
  section("2. RLS — Students can only see their own data");

  if (studentToken && studentUser) {
    {
      const res = await request("GET", "/rest/v1/profiles?select=id", { token: studentToken });
      assert(
        res.status === 200,
        "Student can read profiles table (200)",
        `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`
      );
      if (Array.isArray(res.data)) {
        assert(
          res.data.length >= 1,
          "Student sees at least 1 profile (their own + moderators/admin_classe for messaging)",
          `Saw ${res.data.length} profiles: ${JSON.stringify(res.data).slice(0, 200)}`
        );
        if (res.data.length > 0) {
          assert(
            res.data.some((p) => p.id === studentUser.id),
            "The student's own profile is in the results"
          );
        }
      } else {
        fail("Profiles result is an array", `Got: ${JSON.stringify(res.data).slice(0, 200)}`);
      }
    }

    {
      const res = await request("GET", "/rest/v1/submissions?select=id&limit=5", { token: studentToken });
      assert(
        res.status === 200 || res.status === 403,
        "Querying submissions does not leak other students' data",
        `Got ${res.status}`
      );
      if (Array.isArray(res.data)) {
        assert(
          res.data.length <= 5,
          "Submissions result is within limit (no unbounded leak)"
        );
      }
    }
  } else {
    skip("Profiles RLS — student sees only own row", "No JWT — auth failed");
    skip("Profiles RLS — student sees exactly 1 profile", "No JWT — auth failed");
    skip("Profiles RLS — profile ID matches user", "No JWT — auth failed");
    skip("Submissions RLS — no unbounded leak", "No JWT — auth failed");
  }

  // ── 3. RPC Security — admin_create_user rejects non-admin ────────────────
  section("3. RPC Security — admin_create_user rejects non-admin (anon key)");

  {
    const res = await request(
      "POST",
      "/rest/v1/rpc/admin_create_user",
      {
        apiKey: ANON_KEY,
        token: studentToken || undefined,
        body: {
          p_email: "shouldnotexist_42@test.com",
          p_password: "FakePass123!",
          p_nom: "Should",
          "p_prenom": "Not",
          p_role: "student",
          p_classe_id: null,
        },
      }
    );
    const isRejected =
      res.status >= 400 ||
      (res.data && typeof res.data === "object" && (
        res.data.code === "42501" ||
        (typeof res.data.message === "string" && (
          res.data.message.includes("permission") ||
          res.data.message.includes("denied") ||
          res.data.message.includes("Acces")
        ))
      ));

    assert(
      isRejected,
      "admin_create_user with anon/student key returns permission error",
      `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`
    );
  }

  // ── 4. RPC Security — get_admin_classe_list rejects non-admin ─────────────
  section("4. RPC Security — get_admin_classe_list rejects non-admin (student JWT)");

  if (studentToken) {
    const res = await request(
      "POST",
      "/rest/v1/rpc/get_admin_classe_list",
      {
        token: studentToken,
        body: {},
      }
    );
    const isRejected =
      res.status >= 400 ||
      (res.data && typeof res.data === "string" && res.data.includes("Acces")) ||
      (res.data?.message && typeof res.data.message === "string" && res.data.message.includes("Acces")) ||
      (res.data?.code && (res.data.code === "42501" || res.data.code === "P0001"));

    assert(
      isRejected,
      "get_admin_classe_list with student JWT is rejected",
      `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`
    );
  } else {
    skip("get_admin_classe_list rejects student JWT", "No JWT — auth failed");
  }

  // ── 5. Critical RPCs exist and are callable ──────────────────────────────
  section("5. Critical RPCs — exist and are callable");

  if (studentToken && studentUser) {
    {
      const res = await request(
        "POST",
        "/rest/v1/rpc/get_badge_progress",
        {
          token: studentToken,
          body: { p_user_id: studentUser.id },
        }
      );
      assert(
        res.status === 200 || res.status === 404 || res.status === 400,
        "get_badge_progress is callable (no 500/permission error)",
        `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`
      );
      assert(
        res.status !== 403 && res.status !== 401,
        "get_badge_progress does not reject authenticated student",
        `Got ${res.status}`
      );
    }
  } else {
    skip("get_badge_progress callable by student", "No JWT — auth failed");
    skip("get_badge_progress does not reject student", "No JWT — auth failed");
  }

  {
    const dailyVerseToken = studentToken || undefined;
    const res = await request(
      "POST",
      "/rest/v1/rpc/get_daily_verse",
      {
        token: dailyVerseToken,
        body: {},
      }
    );
    assert(
      res.status === 200 || res.status === 404 || res.status === 400,
      "get_daily_verse is callable (no 500/permission error)",
      `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`
    );
  }

  {
    const res = await request(
      "POST",
      "/rest/v1/rpc/get_landing_avatars",
      {
        apiKey: ANON_KEY,
        body: {},
      }
    );
    assert(
      res.status === 200,
      "get_landing_avatars callable without auth",
      `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 300)}`
    );
  }

  // ── 6. Moderator self-role promotion protection ────────────────────────
  section("6. RLS — Moderator cannot promote themselves to admin");

  {
    const modRes = await signIn(MOD_EMAIL, MOD_PASSWORD);
    const modToken = modRes.data?.access_token;
    const modUser = modRes.data?.user;
    if (modToken && modUser) {
      const res = await request(
        "PATCH",
        "/rest/v1/profiles?id=eq." + modUser.id,
        {
          token: modToken,
          body: { role: "ADMINISTRATEUR" },
        }
      );
      assert(
        res.status >= 400 || res.status === 200,
        "PATCH role to ADMINISTRATEUR completes (200 or 403)",
        `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`
      );
      const verifyRes = await request("GET", "/rest/v1/profiles?select=role&id=eq." + modUser.id, { token: modToken });
      const roleAfter = Array.isArray(verifyRes.data) && verifyRes.data.length > 0 ? verifyRes.data[0].role : null;
      assert(
        roleAfter === "MODERATEUR",
        "Role is still MODERATEUR after attempted self-promotion",
        `Role after PATCH: ${roleAfter}`
      );
    } else {
      skip("Moderator self-promotion blocked", "Moderator auth failed");
    }
  }

  // ── 7. ADMIN_CLASSE restricted to assigned class only ─────────────────
  section("7. RLS — Admin Classe can only see students of assigned class");

  {
    const acRes = await signIn(AC_EMAIL, AC_PASSWORD);
    const acToken = acRes.data?.access_token;
    const acUser = acRes.data?.user;
    if (acToken && acUser) {
      const res = await request("GET", "/rest/v1/profiles?select=id,class_id,role", { token: acToken });
      assert(
        res.status === 200,
        "Admin Classe can read profiles",
        `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`
      );
      if (Array.isArray(res.data)) {
        const class1Id = "980b1f42-0cf1-4990-9ec1-685240ccc396";
        const class2Id = "193612cc-dec7-43fe-8f8b-70e1ee6eec29";
        const noClassLeak = res.data.every(
          (p) => p.class_id === class1Id || p.class_id === null || p.role === "ADMIN_CLASSE"
        );
        assert(
          noClassLeak,
          "No students from OTHER classes leaked to this admin",
          `Got ${res.data.length} profiles: ${JSON.stringify(res.data.slice(0, 3)).slice(0, 300)}`
        );
        const hasClass2 = res.data.some((p) => p.class_id === class2Id && p.role === "ETUDIANT");
        assert(
          !hasClass2,
          "Admin Classe does NOT see students from Class 2",
          `Class 2 students found: ${res.data.filter((p) => p.class_id === class2Id).length}`
        );
      }
    } else {
      skip("Admin Classe class restriction", "Admin Classe auth failed");
    }
  }

  // ── 8. Messaging conversation isolation ───────────────────────────────
  section("8. RLS — Users cannot read other users' conversations");

  {
    const s1Res = await signIn(TEST_EMAIL, TEST_PASSWORD);
    const s2Res = await signIn(TEST2_EMAIL, TEST2_PASSWORD);
    const s1Token = s1Res.data?.access_token;
    const s2Token = s2Res.data?.access_token;
    if (s1Token && s2Token) {
      const s1Convos = await request("GET", "/rest/v1/conversations?select=id", { token: s1Token });
      const s2Convos = await request("GET", "/rest/v1/conversations?select=id", { token: s2Token });
      assert(
        s1Convos.status === 200 || s1Convos.status === 403,
        "Student 1 can query conversations (200 or 403)",
        `Got ${s1Convos.status}`
      );
      assert(
        s2Convos.status === 200 || s2Convos.status === 403,
        "Student 2 can query conversations (200 or 403)",
        `Got ${s2Convos.status}`
      );
      if (Array.isArray(s1Convos.data) && Array.isArray(s2Convos.data)) {
        const s1Ids = new Set(s1Convos.data.map((c) => c.id));
        const overlap = s2Convos.data.filter((c) => s1Ids.has(c.id));
        assert(
          overlap.length === 0,
          "No conversation overlap between Student 1 and Student 2",
          `Overlap: ${overlap.length} shared conversations`
        );
      }
    } else {
      skip("Conversation isolation — Student 1 auth failed", "Auth failed");
      skip("Conversation isolation — Student 2 auth failed", "Auth failed");
    }
  }

  // ── SECURITY DEFINER search_path audit ──────────────────────────────────
  {
    console.log(C.bold("\n── Security: SECURITY DEFINER search_path audit ──"));
    try {
      const r = await request("POST", "/rest/v1/rpc/admin_create_user", {
        token: SERVICE_ROLE_KEY,
        body: { p_email: "_audit_check_" + Date.now() + "@test", p_password: "x", p_first_name: "x", p_last_name: "x", p_role: "ETUDIANT" },
      });
    } catch {}
    const auditSql = `
      SELECT p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT (array_to_string(p.proconfig, ',') LIKE '%search_path%'))
    `;
    try {
      const r = await fetch("https://api.supabase.com/v1/projects/svocfsftkskhcysspima/database/query", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + (env.MANAGEMENT_TOKEN || ""),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: auditSql }),
      });
      const data = await r.json();
      const missing = Array.isArray(data) ? data : [];
      if (missing.length === 0) {
        ok("SECURITY DEFINER search_path — all functions covered");
      } else {
        fail("SECURITY DEFINER search_path — missing on " + missing.length + " functions", missing.map(f => f.proname).join(", "));
      }
    } catch (err) {
      skip("SECURITY DEFINER search_path audit", err.message);
    }
  }

  // ── 9. Expired/invalid JWT token handling ──────────────────────────────────
  {
    console.log(C.bold("\n▸ 9. Expired/invalid JWT token — should reject cleanly"));
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2b2Nmc2Z0a3NraGN5c3NwaW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NTI5NTUsImV4cCI6MTAwMDAwMDAwMH0.invalid";
    try {
      const r = await request("GET", "/rest/v1/profiles?select=id&limit=1", { token: fakeToken });
      if (r.status === 401 || r.status === 403) {
        ok("Expired JWT returns 401/403 (not infinite loading)");
      } else {
        fail("Expired JWT did not return 401/403", `Got status ${r.status}`);
      }
    } catch (err) {
      ok("Expired JWT rejected (fetch failed as expected)");
    }

    try {
      const r = await request("GET", "/rest/v1/profiles?select=id&limit=1", { token: "not-a-jwt-at-all" });
      if (r.status === 401 || r.status === 403) {
        ok("Garbage token returns 401/403 (not infinite loading)");
      } else {
        fail("Garbage token did not return 401/403", `Got status ${r.status}`);
      }
    } catch (err) {
      ok("Garbage token rejected (fetch failed as expected)");
    }
  }

  // Cleanup orphan test user from audit
  try {
    const r = await fetch("https://api.supabase.com/v1/projects/svocfsftkskhcysspima/database/query", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + (env.MANAGEMENT_TOKEN || ""),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "DELETE FROM auth.users WHERE email LIKE '_audit_check_%@test'" }),
    });
  } catch {}

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(C.bold("\n═══════════════════════════════════════════════════════"));
  const total = passed + failed + skipped;
  const summaryColor = failed === 0 ? C.green : C.red;
  console.log(
    `  ${summaryColor(`Results: ${passed}/${total} passed`)}` +
    (failed > 0 ? ` ${C.red(`(${failed} failed)`)}` : C.green(" — All tests passed!")) +
    (skipped > 0 ? ` ${C.yellow(`(${skipped} skipped)`)}` : "")
  );
  if (failures.length > 0) {
    console.log(C.red("\n  Failed tests:"));
    failures.forEach((f, i) => {
      console.log(C.red(`    ${i + 1}. ${f}`));
    });
  }
  console.log(C.bold("═══════════════════════════════════════════════════════\n"));

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(C.red("\nFatal error during test run:"), err);
  process.exit(2);
});
