const storageKey = "mingle-frame:v1";
const themeMap = {
  midnight: {
    background: "#101722",
    panel: "#182334",
    text: "#F7FAFC",
    muted: "#A7B1C0",
    line: "#2D3A4D",
  },
  dawn: {
    background: "#FFF0E8",
    panel: "#FFF9F4",
    text: "#382A31",
    muted: "#7F6871",
    line: "#E8D2CB",
  },
  paper: {
    background: "#F1EFE8",
    panel: "#FFFEF9",
    text: "#202622",
    muted: "#6E7771",
    line: "#D8D8CF",
  },
};
const activityLabels = {
  morning: ["朝", "6–12"],
  day: ["昼", "12–18"],
  evening: ["夜", "18–24"],
  late: ["深夜", "0–6"],
};
const contactLabels = {
  friend: "フレンド申請",
  join: "Join",
  dm: "DM",
  vc: "VC",
};
const knownStyles = new Set(Object.keys(themeMap));
const knownActivities = new Set(Object.keys(activityLabels));
const knownContacts = new Set(Object.keys(contactLabels));

function defaultState() {
  return {
    style: "midnight",
    ratio: "wide",
    accent: "#79F2C0",
    displayName: "",
    handle: "",
    tagline: "",
    interests: ["写真", "ゲーム", "雑談"],
    activities: ["evening", "late"],
    contacts: ["friend", "join", "dm"],
    places: "",
    boundaries: "",
    sessionId: crypto.randomUUID(),
    lastSeen: "",
    readyTracked: false,
  };
}

function readState() {
  const fallback = defaultState();
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!parsed || typeof parsed !== "object") return fallback;
    return {
      ...fallback,
      style: knownStyles.has(parsed.style) ? parsed.style : fallback.style,
      ratio: ["wide", "square"].includes(parsed.ratio) ? parsed.ratio : fallback.ratio,
      accent: /^#[0-9A-F]{6}$/i.test(parsed.accent) ? parsed.accent.toUpperCase() : fallback.accent,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName.slice(0, 24) : "",
      handle: typeof parsed.handle === "string" ? parsed.handle.slice(0, 32) : "",
      tagline: typeof parsed.tagline === "string" ? parsed.tagline.slice(0, 46) : "",
      interests: Array.isArray(parsed.interests)
        ? parsed.interests
            .filter((item) => typeof item === "string")
            .map((item) => item.trim().replace(/\s+/g, " ").slice(0, 16))
            .filter(Boolean)
            .slice(0, 6)
        : fallback.interests,
      activities: Array.isArray(parsed.activities)
        ? parsed.activities.filter((item) => knownActivities.has(item))
        : fallback.activities,
      contacts: Array.isArray(parsed.contacts)
        ? parsed.contacts.filter((item) => knownContacts.has(item))
        : fallback.contacts,
      places: typeof parsed.places === "string" ? parsed.places.slice(0, 90) : "",
      boundaries: typeof parsed.boundaries === "string" ? parsed.boundaries.slice(0, 80) : "",
      sessionId:
        typeof parsed.sessionId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          parsed.sessionId,
        )
          ? parsed.sessionId
          : fallback.sessionId,
      lastSeen: typeof parsed.lastSeen === "string" ? parsed.lastSeen : "",
      readyTracked: Boolean(parsed.readyTracked),
    };
  } catch {
    return fallback;
  }
}

let state = readState();
const imageSlots = [null, null, null];
let activeImageSlot = 0;
let saveTimer;

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  const status = document.querySelector("#save-status");
  if (status) {
    status.textContent = "保存しました";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      status.textContent = "端末に保存";
    }, 1400);
  }
}

function track(name) {
  fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sessionId: state.sessionId }),
    keepalive: true,
  }).catch(() => {});
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function markVisit() {
  const date = today();
  track("visited");
  if (state.lastSeen && state.lastSeen !== date) track("returned");
  state.lastSeen = date;
  saveState();
}

function roundedRect(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  if (fill) context.fill();
  if (stroke) context.stroke();
}

function truncateText(context, text, maximumWidth) {
  if (context.measureText(text).width <= maximumWidth) return text;
  let output = text;
  while (output.length && context.measureText(`${output}…`).width > maximumWidth) {
    output = output.slice(0, -1);
  }
  return `${output}…`;
}

function wrapText(context, text, maximumWidth, maximumLines) {
  if (!text) return [];
  const lines = [];
  let current = "";
  for (const character of text) {
    if (context.measureText(current + character).width > maximumWidth && current) {
      lines.push(current);
      current = character;
      if (lines.length === maximumLines) break;
    } else {
      current += character;
    }
  }
  if (lines.length < maximumLines && current) lines.push(current);
  if (lines.join("").length < text.length) {
    lines[lines.length - 1] = truncateText(context, lines[lines.length - 1], maximumWidth - 12);
  }
  return lines;
}

function drawPlaceholder(context, box, theme, accent, index) {
  context.save();
  roundedRect(context, box.x, box.y, box.width, box.height, box.radius, false, false);
  context.clip();
  const gradient = context.createLinearGradient(
    box.x,
    box.y,
    box.x + box.width,
    box.y + box.height,
  );
  gradient.addColorStop(0, theme.panel);
  gradient.addColorStop(1, `${accent}55`);
  context.fillStyle = gradient;
  context.fillRect(box.x, box.y, box.width, box.height);
  context.strokeStyle = `${accent}77`;
  context.lineWidth = Math.max(2, box.width * 0.008);
  const diameter = Math.min(box.width, box.height) * (index === 0 ? 0.44 : 0.32);
  context.beginPath();
  context.arc(
    box.x + box.width * (0.5 + index * 0.04),
    box.y + box.height * (0.4 - index * 0.03),
    diameter * 0.3,
    0,
    Math.PI * 2,
  );
  context.stroke();
  context.beginPath();
  context.arc(
    box.x + box.width * 0.5,
    box.y + box.height * 0.88,
    diameter * 0.58,
    Math.PI,
    Math.PI * 2,
  );
  context.stroke();
  context.restore();
}

function drawImageCover(context, slot, box, theme, accent, index) {
  if (!slot?.image) {
    drawPlaceholder(context, box, theme, accent, index);
    return;
  }
  const image = slot.image;
  const coverScale = Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight);
  const scale = coverScale * (slot.zoom / 100);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const availableX = Math.max(0, drawWidth - box.width);
  const availableY = Math.max(0, drawHeight - box.height);
  const offsetX = ((slot.x + 100) / 200) * availableX;
  const offsetY = ((slot.y + 100) / 200) * availableY;
  context.save();
  roundedRect(context, box.x, box.y, box.width, box.height, box.radius, false, false);
  context.clip();
  context.drawImage(image, box.x - offsetX, box.y - offsetY, drawWidth, drawHeight);
  context.fillStyle = "rgb(0 0 0 / 8%)";
  context.fillRect(box.x, box.y, box.width, box.height);
  context.restore();
}

function imageBoxes(ratio) {
  const loadedCount = imageSlots.filter(Boolean).length;
  const count = Math.max(1, loadedCount);
  if (ratio === "square") {
    if (count === 1) return [{ x: 54, y: 54, width: 972, height: 410, radius: 38 }];
    if (count === 2) {
      return [
        { x: 54, y: 54, width: 477, height: 410, radius: 38 },
        { x: 549, y: 54, width: 477, height: 410, radius: 38 },
      ];
    }
    return [
      { x: 54, y: 54, width: 626, height: 410, radius: 38 },
      { x: 698, y: 54, width: 328, height: 196, radius: 30 },
      { x: 698, y: 268, width: 328, height: 196, radius: 30 },
    ];
  }
  if (count === 1) return [{ x: 48, y: 48, width: 454, height: 579, radius: 34 }];
  if (count === 2) {
    return [
      { x: 48, y: 48, width: 454, height: 368, radius: 34 },
      { x: 48, y: 434, width: 454, height: 193, radius: 28 },
    ];
  }
  return [
    { x: 48, y: 48, width: 296, height: 579, radius: 34 },
    { x: 362, y: 48, width: 140, height: 280, radius: 26 },
    { x: 362, y: 346, width: 140, height: 281, radius: 26 },
  ];
}

function drawPill(context, text, x, y, theme, accent, filled = false) {
  context.font = "700 21px system-ui, sans-serif";
  const width = Math.min(190, Math.max(82, context.measureText(text).width + 38));
  context.fillStyle = filled ? accent : theme.panel;
  context.strokeStyle = filled ? accent : theme.line;
  context.lineWidth = 2;
  roundedRect(context, x, y, width, 43, 22, true, true);
  context.fillStyle = filled && state.style === "midnight" ? "#10221D" : theme.text;
  context.textBaseline = "middle";
  context.fillText(truncateText(context, text, width - 28), x + 18, y + 22);
  return width;
}

function drawBackground(context, width, height, theme, accent) {
  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);
  context.save();
  context.strokeStyle = `${accent}22`;
  context.lineWidth = 2;
  const gap = state.ratio === "square" ? 90 : 78;
  for (let x = -height; x < width + height; x += gap) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + height, height);
    context.stroke();
  }
  context.restore();
}

function drawWideContent(context, theme, accent) {
  const x = 548;
  const right = 1152;
  context.fillStyle = accent;
  roundedRect(context, x, 48, 86, 10, 5, true, false);
  context.fillStyle = theme.muted;
  context.font = "800 18px system-ui, sans-serif";
  context.letterSpacing = "3px";
  context.fillText("PROFILE CARD", x, 91);
  context.letterSpacing = "0px";

  context.fillStyle = theme.text;
  context.font = "850 51px system-ui, sans-serif";
  context.fillText(truncateText(context, state.displayName.trim() || "Mingle", right - x), x, 154);
  context.fillStyle = theme.muted;
  context.font = "700 23px system-ui, sans-serif";
  context.fillText(truncateText(context, state.handle.trim() || "@your_id", right - x), x, 191);
  context.fillStyle = theme.text;
  context.font = "650 24px system-ui, sans-serif";
  context.fillText(
    truncateText(context, state.tagline.trim() || "のんびり遊んでいます", right - x),
    x,
    233,
  );

  context.fillStyle = theme.muted;
  context.font = "800 17px system-ui, sans-serif";
  context.fillText("INTERESTS", x, 281);
  let pillX = x;
  let pillY = 298;
  for (const interest of state.interests.length ? state.interests : ["好きなこと"]) {
    const expectedWidth = Math.min(190, Math.max(82, context.measureText(interest).width + 38));
    if (pillX + expectedWidth > right) {
      pillX = x;
      pillY += 52;
    }
    pillX += drawPill(context, interest, pillX, pillY, theme, accent) + 10;
  }

  const activityY = pillY + 78;
  context.fillStyle = theme.muted;
  context.font = "800 17px system-ui, sans-serif";
  context.fillText("ACTIVE TIME", x, activityY);
  const segmentWidth = 137;
  Object.entries(activityLabels).forEach(([value, [label, time]], index) => {
    const selected = state.activities.includes(value);
    const segmentX = x + index * (segmentWidth + 10);
    context.fillStyle = selected ? `${accent}33` : theme.panel;
    context.strokeStyle = selected ? accent : theme.line;
    context.lineWidth = 2;
    roundedRect(context, segmentX, activityY + 17, segmentWidth, 64, 16, true, true);
    context.fillStyle = selected ? accent : theme.muted;
    context.font = "800 19px system-ui, sans-serif";
    context.fillText(label, segmentX + 14, activityY + 45);
    context.font = "650 15px system-ui, sans-serif";
    context.fillText(time, segmentX + 14, activityY + 67);
  });

  const contactY = activityY + 119;
  context.fillStyle = theme.muted;
  context.font = "800 17px system-ui, sans-serif";
  context.fillText("WELCOME", x, contactY);
  let contactX = x;
  for (const value of state.contacts.length ? state.contacts : ["friend"]) {
    contactX +=
      drawPill(
        context,
        contactLabels[value] || value,
        contactX,
        contactY + 17,
        theme,
        accent,
        true,
      ) + 9;
  }

  const noteY = contactY + 91;
  const noteWidth = 289;
  context.fillStyle = theme.panel;
  context.strokeStyle = theme.line;
  context.lineWidth = 2;
  roundedRect(context, x, noteY, noteWidth, 92, 18, true, true);
  roundedRect(context, x + noteWidth + 16, noteY, noteWidth, 92, 18, true, true);
  context.fillStyle = theme.muted;
  context.font = "800 14px system-ui, sans-serif";
  context.fillText("PLACES / PLAY", x + 16, noteY + 24);
  context.fillText("BEFORE WE MEET", x + noteWidth + 32, noteY + 24);
  context.fillStyle = theme.text;
  context.font = "650 17px system-ui, sans-serif";
  const places = wrapText(
    context,
    state.places.trim() || "Public巡り・写真撮影・イベント",
    noteWidth - 32,
    2,
  );
  const boundaries = wrapText(
    context,
    state.boundaries.trim() || "聞き専あり / ゆっくり仲良くなりたい",
    noteWidth - 32,
    2,
  );
  places.forEach((line, index) => context.fillText(line, x + 16, noteY + 51 + index * 23));
  boundaries.forEach((line, index) =>
    context.fillText(line, x + noteWidth + 32, noteY + 51 + index * 23),
  );
}

function drawSquareContent(context, theme, accent) {
  const x = 62;
  const right = 1018;
  const top = 518;
  context.fillStyle = accent;
  roundedRect(context, x, top, 76, 9, 5, true, false);
  context.fillStyle = theme.muted;
  context.font = "800 17px system-ui, sans-serif";
  context.fillText("PROFILE CARD", x, top + 39);
  context.fillStyle = theme.text;
  context.font = "850 48px system-ui, sans-serif";
  context.fillText(truncateText(context, state.displayName.trim() || "Mingle", 560), x, top + 96);
  context.fillStyle = theme.muted;
  context.font = "700 21px system-ui, sans-serif";
  context.fillText(
    truncateText(context, state.handle.trim() || "@your_id", 350),
    x + 585,
    top + 90,
  );
  context.fillStyle = theme.text;
  context.font = "650 22px system-ui, sans-serif";
  context.fillText(
    truncateText(context, state.tagline.trim() || "のんびり遊んでいます", right - x),
    x,
    top + 139,
  );

  let pillX = x;
  const pillY = top + 171;
  for (const interest of state.interests.slice(0, 5)) {
    pillX += drawPill(context, interest, pillX, pillY, theme, accent) + 9;
  }

  const boxY = top + 238;
  const boxWidth = 462;
  for (let column = 0; column < 2; column += 1) {
    const boxX = x + column * (boxWidth + 28);
    context.fillStyle = theme.panel;
    context.strokeStyle = theme.line;
    context.lineWidth = 2;
    roundedRect(context, boxX, boxY, boxWidth, 136, 22, true, true);
  }
  context.fillStyle = theme.muted;
  context.font = "800 15px system-ui, sans-serif";
  context.fillText("ACTIVE / WELCOME", x + 20, boxY + 28);
  context.fillText("PLACES / BEFORE WE MEET", x + boxWidth + 48, boxY + 28);
  context.fillStyle = theme.text;
  context.font = "700 19px system-ui, sans-serif";
  const active = state.activities.map((value) => activityLabels[value]?.[0]).filter(Boolean);
  context.fillText(active.length ? active.join("・") : "時間を選択", x + 20, boxY + 62);
  context.font = "650 18px system-ui, sans-serif";
  context.fillText(
    truncateText(
      context,
      state.contacts.map((value) => contactLabels[value]).join(" / ") || "フレンド申請",
      boxWidth - 40,
    ),
    x + 20,
    boxY + 99,
  );
  const noteX = x + boxWidth + 48;
  const noteLines = wrapText(
    context,
    `${state.places.trim() || "Public巡り・写真撮影"} / ${state.boundaries.trim() || "聞き専あり"}`,
    boxWidth - 40,
    3,
  );
  noteLines.forEach((line, index) => context.fillText(line, noteX, boxY + 61 + index * 27));
}

function drawWatermark(context, width, height, theme) {
  context.fillStyle = theme.muted;
  context.font = "700 14px system-ui, sans-serif";
  context.textAlign = "right";
  context.fillText("MINGLE FRAME", width - 32, height - 23);
  context.textAlign = "left";
}

function drawCard() {
  const canvas = document.querySelector("#profile-canvas");
  if (!canvas) return;
  const square = state.ratio === "square";
  canvas.width = square ? 1080 : 1200;
  canvas.height = square ? 1080 : 675;
  canvas.classList.toggle("is-square", square);
  const context = canvas.getContext("2d");
  const theme = themeMap[state.style];
  drawBackground(context, canvas.width, canvas.height, theme, state.accent);
  const boxes = imageBoxes(state.ratio);
  const loaded = imageSlots.filter(Boolean);
  const imagesToDraw = loaded.length ? loaded : [null];
  boxes.forEach((box, index) =>
    drawImageCover(context, imagesToDraw[index], box, theme, state.accent, index),
  );
  if (square) drawSquareContent(context, theme, state.accent);
  else drawWideContent(context, theme, state.accent);
  drawWatermark(context, canvas.width, canvas.height, theme);
  document.querySelector("#export-size").textContent = `${canvas.width} × ${canvas.height} PNG`;
}

function renderTags() {
  const target = document.querySelector("#selected-interests");
  const buttons = state.interests.map((interest) => {
    const button = document.createElement("button");
    const removeMark = document.createElement("span");
    button.dataset.removeInterest = interest;
    button.type = "button";
    button.append(document.createTextNode(interest));
    removeMark.ariaHidden = "true";
    removeMark.textContent = "×";
    button.append(removeMark);
    return button;
  });
  target.replaceChildren(...buttons);
}

function renderImageSlots() {
  for (const label of document.querySelectorAll("[data-slot]")) {
    const index = Number(label.dataset.slot);
    label.classList.toggle("has-image", Boolean(imageSlots[index]));
    label.classList.toggle("is-active", index === activeImageSlot);
    const title = label.querySelector("b");
    if (imageSlots[index]) {
      title.textContent = imageSlots[index].name;
      label.style.setProperty("--thumb", `url("${imageSlots[index].url}")`);
    } else {
      title.textContent = index === 0 ? "メイン" : `追加${index}`;
      label.style.removeProperty("--thumb");
    }
  }
  const controls = document.querySelector("#image-controls");
  const active = imageSlots[activeImageSlot];
  controls.hidden = !active;
  if (active) {
    document.querySelector("#image-x").value = String(active.x);
    document.querySelector("#image-y").value = String(active.y);
    document.querySelector("#image-zoom").value = String(active.zoom);
  }
}

function renderControls() {
  document.querySelector("#display-name").value = state.displayName;
  document.querySelector("#handle").value = state.handle;
  document.querySelector("#tagline").value = state.tagline;
  document.querySelector("#places").value = state.places;
  document.querySelector("#boundaries").value = state.boundaries;
  for (const input of document.querySelectorAll('input[name="style"]')) {
    input.checked = input.value === state.style;
  }
  for (const input of document.querySelectorAll('input[name="activity"]')) {
    input.checked = state.activities.includes(input.value);
  }
  for (const input of document.querySelectorAll('input[name="contact"]')) {
    input.checked = state.contacts.includes(input.value);
  }
  for (const button of document.querySelectorAll("[data-ratio]")) {
    button.setAttribute("aria-pressed", String(button.dataset.ratio === state.ratio));
  }
  for (const button of document.querySelectorAll("[data-color]")) {
    button.setAttribute("aria-pressed", String(button.dataset.color === state.accent));
  }
  document.querySelector("#accent-value").textContent = state.accent;
  renderTags();
  renderImageSlots();
}

function renderAll() {
  renderControls();
  drawCard();
}

function checkReady() {
  if (
    !state.readyTracked &&
    state.displayName.trim() &&
    imageSlots.some(Boolean) &&
    state.interests.length
  ) {
    state.readyTracked = true;
    saveState();
    track("card_ready");
  }
}

function updateAndDraw() {
  saveState();
  drawCard();
  checkReady();
}

function addInterest(value) {
  const interest = value.trim().replace(/\s+/g, " ").slice(0, 16);
  if (!interest || state.interests.includes(interest)) return;
  if (state.interests.length >= 6) {
    document.querySelector("#interest-input").setCustomValidity("好きなことは6つまでです");
    document.querySelector("#interest-input").reportValidity();
    return;
  }
  document.querySelector("#interest-input").setCustomValidity("");
  state.interests.push(interest);
  document.querySelector("#interest-input").value = "";
  saveState();
  renderTags();
  drawCard();
}

function loadImage(file, slotIndex) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    alert("JPEG、PNG、WebP画像を選んでください。");
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    alert("画像は1枚12MB以下にしてください。");
    return;
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    if (imageSlots[slotIndex]?.url) URL.revokeObjectURL(imageSlots[slotIndex].url);
    imageSlots[slotIndex] = {
      image,
      name: file.name.length > 18 ? `${file.name.slice(0, 15)}…` : file.name,
      url,
      x: 0,
      y: 0,
      zoom: 100,
    };
    activeImageSlot = slotIndex;
    renderImageSlots();
    drawCard();
    checkReady();
    track("image_added");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    alert("画像を読み込めませんでした。");
  };
  image.src = url;
}

function removeActiveImage() {
  const slot = imageSlots[activeImageSlot];
  if (!slot) return;
  URL.revokeObjectURL(slot.url);
  imageSlots[activeImageSlot] = null;
  activeImageSlot = imageSlots.findIndex(Boolean);
  if (activeImageSlot < 0) activeImageSlot = 0;
  renderImageSlots();
  drawCard();
}

function downloadCard(event) {
  const canvas = document.querySelector("#profile-canvas");
  const button = event.currentTarget;
  canvas.toBlob((blob) => {
    if (!blob) {
      button.textContent = "保存できません";
      alert("PNGを生成できませんでした。");
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const name = (state.displayName.trim() || "profile")
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|]/g, "-")
      .slice(0, 32);
    anchor.href = url;
    anchor.download = `mingle-frame-${name}.png`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    button.textContent = "保存しました";
    setTimeout(() => {
      button.textContent = "PNGを保存";
    }, 1600);
    track("downloaded");
  }, "image/png");
}

async function copyPost(event) {
  const button = event.currentTarget;
  const interests = state.interests
    .map((interest) => `#${interest.replaceAll(/\s/g, "")}`)
    .join(" ");
  const text = [
    state.displayName.trim()
      ? `${state.displayName.trim()}の自己紹介カードです。`
      : "自己紹介カードを更新しました。",
    interests,
    "#MingleFrame #VRChat自己紹介カード",
  ]
    .filter(Boolean)
    .join("\n");
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "コピーしました";
    setTimeout(() => {
      button.textContent = "投稿文をコピー";
    }, 1600);
    track("post_copied");
  } catch {
    button.textContent = "コピーできません";
  }
}

function resetCard() {
  if (!confirm("文字入力とデザイン設定を初期化しますか？画像も画面から外れます。")) return;
  for (const slot of imageSlots) {
    if (slot?.url) URL.revokeObjectURL(slot.url);
  }
  imageSlots.fill(null);
  state = { ...defaultState(), sessionId: state.sessionId, lastSeen: state.lastSeen };
  saveState();
  renderAll();
}

function bindEvents() {
  for (const [selector, key] of [
    ["#display-name", "displayName"],
    ["#handle", "handle"],
    ["#tagline", "tagline"],
    ["#places", "places"],
    ["#boundaries", "boundaries"],
  ]) {
    document.querySelector(selector).addEventListener("input", (event) => {
      state[key] = event.target.value;
      updateAndDraw();
    });
  }

  for (const input of document.querySelectorAll('input[name="style"]')) {
    input.addEventListener("change", (event) => {
      state.style = event.target.value;
      updateAndDraw();
    });
  }

  document.querySelector("#activity-options").addEventListener("change", () => {
    state.activities = [...document.querySelectorAll('input[name="activity"]:checked')].map(
      (input) => input.value,
    );
    updateAndDraw();
  });

  document.querySelector("#contact-options").addEventListener("change", () => {
    state.contacts = [...document.querySelectorAll('input[name="contact"]:checked')].map(
      (input) => input.value,
    );
    updateAndDraw();
  });

  document.querySelector("#image-slots").addEventListener("change", (event) => {
    const input = event.target.closest("[data-image-input]");
    if (!input) return;
    const label = input.closest("[data-slot]");
    loadImage(input.files?.[0], Number(label.dataset.slot));
    input.value = "";
  });

  document.querySelector("#image-slots").addEventListener("click", (event) => {
    const label = event.target.closest("[data-slot]");
    if (!label) return;
    const index = Number(label.dataset.slot);
    if (imageSlots[index]) {
      event.preventDefault();
      activeImageSlot = index;
      renderImageSlots();
    }
  });

  for (const [selector, key] of [
    ["#image-x", "x"],
    ["#image-y", "y"],
    ["#image-zoom", "zoom"],
  ]) {
    document.querySelector(selector).addEventListener("input", (event) => {
      if (!imageSlots[activeImageSlot]) return;
      imageSlots[activeImageSlot][key] = Number(event.target.value);
      drawCard();
    });
  }
  document.querySelector("#remove-image").addEventListener("click", removeActiveImage);

  document.querySelector("#add-interest").addEventListener("click", () => {
    addInterest(document.querySelector("#interest-input").value);
  });
  document.querySelector("#interest-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addInterest(event.currentTarget.value);
    }
  });
  document.querySelector("#interest-suggestions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-interest]");
    if (button) addInterest(button.dataset.interest);
  });
  document.querySelector("#selected-interests").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-interest]");
    if (!button) return;
    state.interests = state.interests.filter(
      (interest) => interest !== button.dataset.removeInterest,
    );
    saveState();
    renderTags();
    drawCard();
  });

  document.querySelector(".ratio-switch").addEventListener("click", (event) => {
    const button = event.target.closest("[data-ratio]");
    if (!button) return;
    state.ratio = button.dataset.ratio;
    saveState();
    renderControls();
    drawCard();
  });

  document.querySelector("#accent-row").addEventListener("click", (event) => {
    const button = event.target.closest("[data-color]");
    if (!button) return;
    state.accent = button.dataset.color;
    updateAndDraw();
    renderControls();
  });

  document.querySelector("#download-card").addEventListener("click", downloadCard);
  document.querySelector("#copy-post").addEventListener("click", (event) => void copyPost(event));
  document.querySelector("#reset-card").addEventListener("click", resetCard);
}

function boot() {
  markVisit();
  if (!document.querySelector("#profile-canvas")) return;
  renderAll();
  bindEvents();
}

boot();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
