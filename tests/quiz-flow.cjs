// Test fonctionnel des flows quiz (passage multiple, update, duplicate, reuse)
const https = require("https");
const env = require("./env.cjs");

const SB_URL = env.SUPABASE_URL;
const ANON = env.SUPABASE_ANON_KEY;

const STUDENT_EMAIL = "test1@acvha.org";
const STUDENT_PASS = "AcVh2026!";
const AC_EMAIL = "adminclasse@acvha.org";
const AC_PASS = "AcVh2026!";

function request(method, path, { apiKey = ANON, token, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, SB_URL);
    const headers = { apikey: apiKey, "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const bodyStr = body ? JSON.stringify(body) : '';
    if (bodyStr) headers["Content-Length"] = Buffer.byteLength(bodyStr);
    const req = https.request({ hostname: u.hostname, port: 443, path: u.pathname + u.search, method, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        let data; try { data = JSON.parse(raw); } catch { data = raw; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function signIn(email, password) {
  return request("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
}

(async () => {
  let pass = 0, fail = 0;
  const ok = (l) => { pass++; console.log("  \x1b[32m\u2714 PASS\x1b[0m " + l); };
  const bad = (l, d) => { fail++; console.log("  \x1b[31m\u2716 FAIL\x1b[0m " + l + " — " + (d ?? "").toString().slice(0, 300)); };

  const acRes = await signIn(AC_EMAIL, AC_PASS);
  const acToken = acRes.data?.access_token;
  if (!acToken) { console.log("admin-classe login failed", acRes.data); process.exit(2); }
  ok("admin-classe sign-in");

  const stRes = await signIn(STUDENT_EMAIL, STUDENT_PASS);
  const stToken = stRes.data?.access_token;
  if (!stToken) { console.log("student login failed", stRes.data); process.exit(2); }
  ok("student sign-in");

  // Course cible (cours d'une classe gérée par admin-classe). On prend le 1er cours Classe 1.
  const class1Id = "980b1f42-0cf1-4990-9ec1-685240ccc396";
  const coursesRes = await request("GET", `/rest/v1/courses?select=id,title,class_id,mise_en_pratique&class_id=eq.${class1Id}&limit=3`, { token: acToken });
  const courses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
  if (courses.length === 0) { console.log("no course for class1"); process.exit(2); }
  ok(`loaded ${courses.length} course(s) for class1`);

  // 1) Création d'un quiz de test
  const quizTitle = "Quiz E2E " + Date.now();
  const createRes = await request("POST", "/rest/v1/rpc/create_quiz", {
    token: acToken,
    body: {
      p_course_id: courses[0].id,
      p_title: quizTitle,
      p_description: "test",
      p_time_limit_minutes: 10,
      p_passing_score: 10,
      p_questions: [
        { question_text: "Q1", options: ["A", "B"], correct_option_index: 0, points: 1 },
        { question_text: "Q2", options: ["X", "Y"], correct_option_index: 1, points: 1 },
      ],
    },
  });
  const quizId = createRes.data;
  if (createRes.status !== 200 || typeof quizId !== "string") { console.log("create_quiz failed", createRes.data); process.exit(2); }
  ok("create_quiz -> id " + quizId.slice(0, 8));

  // 2) get_admin_quiz_questions renvoie la bonne réponse
  const adminQ = await request("POST", "/rest/v1/rpc/get_admin_quiz_questions", { token: acToken, body: { p_quiz_id: quizId } });
  const aq = Array.isArray(adminQ.data) ? adminQ.data : [];
  if (aq.length === 2 && aq[0].correct_option_index === 0 && aq[1].correct_option_index === 1) {
    ok("get_admin_quiz_questions returns correct_option_index");
  } else {
    bad("get_admin_quiz_questions returns correct_option_index", JSON.stringify(adminQ.data));
  }

  // 3) Le quiz est dans get_all_quizzes
  const allQ = await request("POST", "/rest/v1/rpc/get_all_quizzes", { token: acToken, body: {} });
  const allArr = Array.isArray(allQ.data) ? allQ.data : [];
  if (allArr.some((q) => q.id === quizId)) ok("get_all_quizzes lists new quiz");
  else bad("get_all_quizzes lists new quiz", JSON.stringify(allQ.data).slice(0, 200));

  // 4) update_quiz modifie titre + questions
  const upd = await request("POST", "/rest/v1/rpc/update_quiz", {
    token: acToken,
    body: {
      p_quiz_id: quizId,
      p_title: quizTitle + " (modifié)",
      p_description: "mod",
      p_time_limit_minutes: 5,
      p_passing_score: 8,
      p_questions: [
        { question_text: "Q1b", options: ["A", "B", "C"], correct_option_index: 2, points: 2 },
      ],
    },
  });
  if (upd.status === 200 || upd.status === 204) ok("update_quiz no error");
  else bad("update_quiz no error", JSON.stringify(upd.data));

  const adminQ2 = await request("POST", "/rest/v1/rpc/get_admin_quiz_questions", { token: acToken, body: { p_quiz_id: quizId } });
  const aq2 = Array.isArray(adminQ2.data) ? adminQ2.data : [];
  if (aq2.length === 1 && aq2[0].question_text === "Q1b" && aq2[0].correct_option_index === 2) {
    ok("update_quiz applied new title questions");
  } else {
    bad("update_quiz applied new title questions", JSON.stringify(adminQ2.data));
  }

  // 5) duplicate_quiz vers le 2e cours (ou même cours)
  const targetCourse = courses.length > 1 ? courses[1].id : courses[0].id;
  const dup = await request("POST", "/rest/v1/rpc/duplicate_quiz", {
    token: acToken,
    body: { p_quiz_id: quizId, p_course_id: targetCourse, p_title: quizTitle + " (copie)" },
  });
  const dupId = dup.data;
  if (dup.status === 200 && typeof dupId === "string") ok("duplicate_quiz -> " + dupId.slice(0, 8));
  else bad("duplicate_quiz", JSON.stringify(dup.data));

  // 6) Passage multiple étudiant : 2 tentatives consécutives
  let s1 = await request("POST", "/rest/v1/rpc/start_quiz", { token: stToken, body: { p_quiz_id: quizId } });
  if (s1.status === 200) ok("start_quiz #1");
  else bad("start_quiz #1", JSON.stringify(s1.data));
  const firstAttemptId = s1.data?.attempt_id

  // submit 1
  const qids = (Array.isArray(s1.data?.questions) ? s1.data.questions : []).map((q) => q.id);
  const ans1 = {}; qids.forEach((id, i) => ans1[id] = i);
  let sub1 = await request("POST", "/rest/v1/rpc/submit_quiz", { token: stToken, body: { p_quiz_id: quizId, p_answers: ans1 } });
  if (sub1.status === 200) ok("submit_quiz #1 score=" + sub1.data?.score);
  else bad("submit_quiz #1", JSON.stringify(sub1.data));

  // start again (should NOT error, new attempt)
  let s2 = await request("POST", "/rest/v1/rpc/start_quiz", { token: stToken, body: { p_quiz_id: quizId } });
  if (s2.status === 200 && s2.data?.attempt_id !== firstAttemptId) ok("start_quiz #2 is a NEW attempt (multi-try)");
  else bad("start_quiz #2 is a NEW attempt (multi-try)", JSON.stringify(s2.data));

  // submit 2
  let sub2 = await request("POST", "/rest/v1/rpc/submit_quiz", { token: stToken, body: { p_quiz_id: quizId, p_answers: ans1 } });
  if (sub2.status === 200) ok("submit_quiz #2 (2nd try)");
  else bad("submit_quiz #2", JSON.stringify(sub2.data));

  // 7) attempt_count >= 2 via get_course_quizzes (version admin 1-arg)
  const gc = await request("POST", "/rest/v1/rpc/get_course_quizzes", { token: acToken, body: { p_course_id: courses[0].id } });
  const gcArr = Array.isArray(gc.data) ? gc.data : [];
  const found = gcArr.find((q) => q.id === quizId);
  if (found && found.attempt_count >= 2) ok("attempt_count >= 2 recorded");
  else bad("attempt_count >= 2 recorded", JSON.stringify(gc.data).slice(0, 300));

  // 8) get_quiz_with_questions exposed attempt_count to student
  let qw = await request("POST", "/rest/v1/rpc/get_quiz_with_questions", { token: stToken, body: { p_quiz_id: quizId } });
  if (qw.status === 200 && qw.data?.attempted === true && qw.data?.attempt_count >= 2) {
    ok("get_quiz_with_questions attempted=true attempt_count>=2 (no hiding)");
  } else {
    bad("get_quiz_with_questions attempted/attempt_count", JSON.stringify(qw.data));
  }

  // 9) get_course_quizzes (2-arg, student) attempt_count accessible
  let gc2 = await request("POST", "/rest/v1/rpc/get_course_quizzes", { token: stToken, body: { p_course_id: courses[0].id, p_student_id: stRes.data.user.id } });
  const gc2Arr = Array.isArray(gc2.data) ? gc2.data : [];
  const f2 = gc2Arr.find((q) => q.id === quizId);
  if (f2 && f2.attempted === true) ok("get_course_quizzes(2-arg) attempted=true");
  else bad("get_course_quizzes(2-arg) attempted=true", JSON.stringify(gc2.data).slice(0, 200));

  // 10) mise_en_pratique via RPC (admin-classe / modérateur)
  const mep = "Exo " + Date.now();
  const updCourse = await request("POST", "/rest/v1/rpc/save_course_mise_en_pratique", {
    token: acToken,
    body: { p_course_id: courses[0].id, p_text: mep },
  });
  if (updCourse.status === 200 || updCourse.status === 204) ok("save_course_mise_en_pratique");
  else bad("save_course_mise_en_pratique", JSON.stringify(updCourse.data).slice(0, 200));

  const readBack = await request("GET", `/rest/v1/courses?select=id,mise_en_pratique&id=eq.${courses[0].id}`, { token: acToken });
  const rbArr = Array.isArray(readBack.data) ? readBack.data : [];
  if (rbArr.length === 1 && rbArr[0].mise_en_pratique === mep) ok("mise_en_pratique persisted (read-back)");
  else bad("mise_en_pratique persisted (read-back)", JSON.stringify(readBack.data).slice(0, 200));

  // remise à vide
  await request("POST", "/rest/v1/rpc/save_course_mise_en_pratique", { token: acToken, body: { p_course_id: courses[0].id, p_text: "" } });



  // nettoyage
  await request("POST", "/rest/v1/rpc/delete_quiz", { token: acToken, body: { p_quiz_id: quizId } });
  if (dupId && typeof dupId === "string") await request("POST", "/rest/v1/rpc/delete_quiz", { token: acToken, body: { p_quiz_id: dupId } });

  console.log("\n  " + (fail === 0 ? `\x1b[32mResults: ${pass}/${pass + fail} passed\x1b[0m` : `\x1b[31mResults: ${pass}/${pass + fail} (${fail} failed)\x1b[0m`));
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => { console.error("Fatal:", e); process.exit(2); });
