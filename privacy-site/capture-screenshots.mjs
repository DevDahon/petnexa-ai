import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(import.meta.dirname, "screenshots");
const BASE_URL = process.env.PETNEXA_SCREENSHOT_URL || "http://localhost:8098";
const CDP_PORT = process.env.PETNEXA_CHROME_CDP_PORT || "9224";
const CDP_BASE = `http://127.0.0.1:${CDP_PORT}`;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const today = todayIso();

const demoSnapshot = {
  owner: { id: "owner_1", fullName: "PetNexa Demo", birthday: "2000-01-01" },
  pets: [
    {
      id: "pet_buddy",
      name: "Buddy",
      species: "Dog",
      breed: "Golden Retriever",
      sex: "Male",
      birthday: "2023-04-12",
      weightKg: 12.5,
      color: "Golden",
      microchipNumber: "DEMO-0001",
      notes: "Friendly demo pet.",
      assignedVetId: "vet_1",
      createdAt: today,
    },
    {
      id: "pet_luna",
      name: "Luna",
      species: "Cat",
      breed: "Persian Cat",
      sex: "Female",
      birthday: "2022-05-20",
      weightKg: 4.2,
      color: "Gray",
      notes: "Demo pet profile.",
      assignedVetId: "vet_1",
      createdAt: today,
    },
    {
      id: "pet_max",
      name: "Max",
      species: "Dog",
      breed: "Beagle",
      sex: "Male",
      birthday: "2025-01-18",
      weightKg: 8.7,
      color: "Tri-color",
      notes: "Demo puppy profile.",
      assignedVetId: "vet_2",
      createdAt: today,
    },
  ],
  veterinarians: [
    {
      id: "vet_1",
      clinicName: "Happy Paws Clinic",
      veterinarianName: "Dr. Demo",
      phone: "+1 555 0200",
      email: "care@example.com",
      address: "45 Vet Care Road",
      website: "https://example.com",
      emergencyHotline: "+1 555 0911",
      hours: "Mon-Sat, 8 AM - 6 PM",
      notes: "Demo clinic.",
      isPrimary: true,
      createdAt: today,
    },
    {
      id: "vet_2",
      clinicName: "City Animal ER",
      veterinarianName: "Emergency Desk",
      phone: "+1 555 0300",
      email: "er@example.com",
      address: "88 Emergency Lane",
      website: "https://example.org",
      emergencyHotline: "+1 555 0999",
      hours: "24/7",
      notes: "Demo emergency clinic.",
      isPrimary: false,
      createdAt: today,
    },
  ],
  records: [
    {
      id: "record_1",
      petId: "pet_buddy",
      type: "Deworming",
      date: today,
      veterinarian: "Dr. Demo",
      clinic: "Happy Paws Clinic",
      notes: "Routine deworming completed.",
      nextScheduleDate: addDays(today, 14),
      createdAt: today,
    },
    {
      id: "record_2",
      petId: "pet_luna",
      type: "Vaccination",
      date: addDays(today, -4),
      veterinarian: "Dr. Demo",
      clinic: "Happy Paws Clinic",
      notes: "Rabies booster completed.",
      nextScheduleDate: addDays(today, 5),
      createdAt: today,
    },
    {
      id: "record_3",
      petId: "pet_buddy",
      type: "Checkup",
      date: addDays(today, -16),
      veterinarian: "Dr. Demo",
      clinic: "Happy Paws Clinic",
      notes: "Healthy demo exam.",
      createdAt: today,
    },
  ],
  reminders: [
    {
      id: "reminder_1",
      petId: "pet_buddy",
      type: "Deworming",
      title: "Deworming",
      dueDate: today,
      linkedRecordId: "record_1",
      notes: "Follow vet schedule.",
      createdAt: today,
    },
    {
      id: "reminder_2",
      petId: "pet_luna",
      type: "Vaccination",
      title: "Vaccine (Rabies)",
      dueDate: addDays(today, 5),
      linkedRecordId: "record_2",
      notes: "Bring vaccination card.",
      createdAt: today,
    },
    {
      id: "reminder_3",
      petId: "pet_max",
      type: "Appointment",
      title: "Vet Appointment",
      dueDate: addDays(today, 13),
      notes: "Initial puppy check.",
      createdAt: today,
    },
  ],
  consultations: [
    {
      id: "consult_1",
      petId: "pet_luna",
      preset: "My pet is not eating",
      symptoms: "Reduced appetite for one meal.",
      appetite: "Low",
      waterIntake: "Normal",
      behaviorChanges: "Resting more than usual",
      vomiting: "No",
      diarrhea: "No",
      mobility: "Normal",
      breathing: "Normal",
      injury: "None",
      notes: "Monitoring at home.",
      riskLevel: "Mild",
      guidance: "Monitor appetite and hydration. Contact a veterinarian if symptoms continue or worsen.",
      emergencyFlags: "",
      createdAt: addDays(today, -1),
    },
  ],
  creditState: {
    aiCredits: 3,
    starterCreditsGranted: true,
    weeklyAdWatchCount: 0,
    lastWeeklyResetDate: today,
    totalConsultationsUsed: 0,
  },
  settings: {
    notificationsEnabled: true,
    dailySummaryTime: "08:00",
    careMode: "solo",
    syncEnabled: false,
    analyticsEnabled: false,
    diagnosticsEnabled: false,
    adsPersonalizationConsent: false,
    privacyAcknowledgedAt: new Date().toISOString(),
    aiDisclaimerAcceptedAt: new Date().toISOString(),
  },
};

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result || {});
  };

  return {
    opened: new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    }),
    send(method, params = {}) {
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

async function createTarget() {
  const response = await fetch(`${CDP_BASE}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  if (!response.ok) throw new Error(`Could not create Chrome target: ${response.status}`);
  return response.json();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createPage({ demo }) {
  const target = await createTarget();
  const client = connect(target.webSocketDebuggerUrl);
  await client.opened;
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 430,
    height: 932,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await client.send("Emulation.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const setupSource = demo
    ? `localStorage.clear(); localStorage.setItem("petnexa_web_snapshot", ${JSON.stringify(JSON.stringify(demoSnapshot))}); localStorage.setItem("petnexa_last_opened", new Date().toISOString());`
    : "localStorage.clear();";
  await client.send("Page.addScriptToEvaluateOnNewDocument", { source: setupSource });
  return client;
}

async function navigateAndWait(client, url, textProbe) {
  await client.send("Page.navigate", { url });
  const start = Date.now();

  while (Date.now() - start < 45000) {
    await delay(800);
    const result = await client
      .send("Runtime.evaluate", {
        expression: `document.body && document.body.innerText.includes(${JSON.stringify(textProbe)})`,
        returnByValue: true,
      })
      .catch(() => ({ result: { value: false } }));

    if (result.result?.value) {
      await delay(2500);
      return;
    }
  }

  throw new Error(`Timed out waiting for ${textProbe} at ${url}`);
}

async function clickText(client, text) {
  const result = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const targetText = ${JSON.stringify(text)};
      const visible = (node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const nodes = [...document.querySelectorAll("*")].filter((node) => (node.innerText || node.textContent || "").trim().includes(targetText) && visible(node));
      const node = nodes[nodes.length - 1];
      if (!node) return false;
      node.click();
      return true;
    })()`,
    returnByValue: true,
  });
  await delay(1600);
  return Boolean(result.result?.value);
}

async function clickLabel(client, label) {
  const result = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const targetLabel = ${JSON.stringify(label)};
      const visible = (node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const nodes = [...document.querySelectorAll("[aria-label]")].filter((node) => node.getAttribute("aria-label") === targetLabel && visible(node));
      const node = nodes[nodes.length - 1];
      if (!node) return false;
      node.click();
      return true;
    })()`,
    returnByValue: true,
  });
  await delay(1800);
  return Boolean(result.result?.value);
}

async function scrollDown(client, amount = 650) {
  await client.send("Runtime.evaluate", {
    expression: `(() => {
      window.scrollBy(0, ${amount});
      const nodes = [...document.querySelectorAll("*")];
      for (const node of nodes) {
        try {
          if (node.scrollHeight > node.clientHeight) node.scrollTop += ${amount};
        } catch (_) {}
      }
    })()`,
  });
  await delay(900);
}

async function waitForText(client, textProbe) {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    await delay(700);
    const result = await client
      .send("Runtime.evaluate", {
        expression: `document.body && document.body.innerText.includes(${JSON.stringify(textProbe)})`,
        returnByValue: true,
      })
      .catch(() => ({ result: { value: false } }));
    if (result.result?.value) {
      await delay(1200);
      return;
    }
  }
  throw new Error(`Timed out waiting for ${textProbe}`);
}

async function screenshot(client, filename) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const file = path.join(OUT_DIR, filename);
  await fs.writeFile(file, Buffer.from(result.data, "base64"));
  const stat = await fs.stat(file);
  if (stat.size < 10000) throw new Error(`${filename} is unexpectedly small.`);
  return { filename, size: stat.size };
}

async function captureOne(config) {
  const client = await createPage({ demo: config.demo });
  try {
    await navigateAndWait(client, config.url, config.probe);
    if (config.click) await clickText(client, config.click);
    return await screenshot(client, config.file);
  } finally {
    client.close();
  }
}

await fs.mkdir(OUT_DIR, { recursive: true });

const captures = [];
captures.push(await captureOne({ demo: false, url: BASE_URL, probe: "Set up your owner profile", file: "01-onboarding-login.png" }));

const app = await createPage({ demo: true });
try {
  await navigateAndWait(app, BASE_URL, "Featured Pet");
  captures.push(await screenshot(app, "02-dashboard.png"));

  if (!(await clickLabel(app, "Pets"))) throw new Error("Could not open Pets tab.");
  await waitForText(app, "My Pets");
  captures.push(await screenshot(app, "03-my-pets.png"));

  if (!(await clickLabel(app, "Records"))) throw new Error("Could not open Records tab.");
  await waitForText(app, "Records");
  captures.push(await screenshot(app, "04-records.png"));

  if (!(await clickLabel(app, "AI"))) throw new Error("Could not open AI tab.");
  await waitForText(app, "AI");
  captures.push(await screenshot(app, "05-ai-assistant.png"));
} finally {
  app.close();
}

const settings = await createPage({ demo: true });
try {
  await navigateAndWait(settings, BASE_URL, "Featured Pet");
  if (!(await clickLabel(settings, "Open settings"))) throw new Error("Could not open settings.");
  await waitForText(settings, "Settings");
  await scrollDown(settings, 720);
  await clickText(settings, "Legal & Privacy");
  await waitForText(settings, "Privacy Policy");
  await scrollDown(settings, 180);
  captures.push(await screenshot(settings, "06-settings-privacy-controls.png"));
} finally {
  settings.close();
}

console.table(captures);
console.log(`Saved screenshots to ${path.relative(ROOT, OUT_DIR)}`);
