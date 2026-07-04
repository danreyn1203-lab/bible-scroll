import { logout } from "../../core/authClient.js";
import { toast } from "./toast.js";

async function fetchMe() {
  const res = await fetch("/api/users/me", { credentials: "same-origin" });
  return res.ok ? res.json() : null;
}

async function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function shrinkImage(file, maxDim = 256) {
  const dataUrl = await fileToDataURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function saveProfile(body) {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  return res.ok ? res.json() : null;
}

async function toggle2FA(enabled) {
  const res = await fetch("/api/auth/2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ enabled }),
  });
  return res.ok;
}

export async function showAccountMenu(anchorEl, onChange) {
  document.querySelectorAll(".account-menu").forEach(n => n.remove());

  const me = await fetchMe();
  if (!me) {
    // Fall back to a minimal panel so the click always produces something
    const rect = anchorEl.getBoundingClientRect();
    const fallback = document.createElement("div");
    fallback.className = "account-menu account-menu--panel";
    fallback.style.top = `${rect.bottom + 8}px`;
    fallback.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
    fallback.innerHTML = `
      <div class="account-panel-section">
        <p style="font-size:13px;color:var(--muted);margin:0 0 10px">Couldn't load your profile — your session may have expired.</p>
        <button class="account-menu-item account-menu-signout" id="acct-signout-fallback">Sign out</button>
      </div>`;
    document.body.appendChild(fallback);
    const close = () => { fallback.remove(); document.removeEventListener("click", onDoc, true); };
    const onDoc = e => { if (!fallback.contains(e.target) && e.target !== anchorEl) close(); };
    setTimeout(() => document.addEventListener("click", onDoc, true), 0);
    fallback.querySelector("#acct-signout-fallback").addEventListener("click", async () => {
      close(); await logout(); onChange?.(null);
    });
    return;
  }

  const rect = anchorEl.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.className = "account-menu account-menu--panel";
  menu.style.top = `${rect.bottom + 8}px`;
  menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;

  const name = me.displayName || me.email;
  const initial = (name || "A")[0].toUpperCase();

  menu.innerHTML = `
    <div class="account-panel-header">
      <div class="account-panel-avatar-wrap">
        <div class="account-panel-avatar" id="acct-avatar-preview">
          ${me.avatarUrl ? `<img src="${me.avatarUrl}" alt="" />` : `<span>${initial}</span>`}
        </div>
        <label class="account-panel-upload">
          Change photo
          <input type="file" accept="image/*" hidden id="acct-photo-input" />
        </label>
      </div>
      <div class="account-panel-id">
        <div class="account-panel-name">${name}</div>
        <div class="account-panel-email">${me.email}</div>
      </div>
    </div>

    <div class="account-panel-section">
      <div class="account-panel-section-title">Profile</div>
      <label class="account-panel-field">
        <span>Display name</span>
        <input type="text" id="acct-name" maxlength="60" value="${me.displayName || ""}" placeholder="What should we call you?" />
      </label>
      <label class="account-panel-field">
        <span>Bio</span>
        <textarea id="acct-bio" maxlength="280" rows="3" placeholder="A line about you (optional)">${me.bio || ""}</textarea>
        <span class="account-panel-hint"><span id="acct-bio-count">${(me.bio || "").length}</span> / 280</span>
      </label>
      <button class="account-panel-save" id="acct-save">Save changes</button>
    </div>

    <div class="account-panel-section">
      <div class="account-panel-section-title">Security</div>
      <div class="account-menu-setting">
        <span>Two-factor (email code)</span>
        <label class="account-toggle">
          <input type="checkbox" id="acct-2fa" ${me.twoFactorEnabled ? "checked" : ""} />
          <span class="account-toggle-track"></span>
        </label>
      </div>
    </div>

    ${me.role === "admin" || me.role === "moderator" ? `
    <div class="account-panel-section">
      <div class="account-panel-section-title">Staff</div>
      <a class="account-menu-item account-menu-admin" href="/admin.html">⚙️ Open admin dashboard</a>
    </div>` : ""}

    <div class="account-panel-section">
      <div class="account-panel-section-title" style="display:flex;align-items:center;justify-content:space-between;">
        Friends
        <span id="acct-friends-count" style="font-size:11px;font-weight:600;background:rgba(201,161,74,.2);color:var(--gold);padding:2px 7px;border-radius:999px;">…</span>
      </div>
      <div id="acct-friends-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;min-height:32px;">
        <div style="font-size:12px;color:var(--muted);">Loading…</div>
      </div>
      <div id="acct-incoming-requests" style="display:none;"></div>
      <a class="account-menu-item" href="/friends.html" style="font-size:12px;color:var(--muted);text-align:center;justify-content:center;">Manage all friends</a>
    </div>

    <div class="account-panel-section">
      <a class="account-menu-item" href="/library.html">My Library</a>
      <a class="account-menu-item" href="/reading-plan.html">Daily Reading Plan</a>
      <a class="account-menu-item" href="/profile.html?id=${me.id}">View public profile</a>
      <button class="account-menu-item account-menu-signout" id="acct-signout">Sign out</button>
    </div>
  `;

  document.body.appendChild(menu);

  const close = () => {
    menu.remove();
    document.removeEventListener("click", onDocClick, true);
  };
  const onDocClick = e => {
    if (!menu.contains(e.target) && e.target !== anchorEl) close();
  };
  setTimeout(() => document.addEventListener("click", onDocClick, true), 0);

  let avatarDataUrl = null;
  const preview = menu.querySelector("#acct-avatar-preview");
  menu.querySelector("#acct-photo-input").addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("Image too large (max 5MB)"); return; }
    avatarDataUrl = await shrinkImage(file);
    preview.innerHTML = `<img src="${avatarDataUrl}" alt="" />`;
  });

  const bioInput = menu.querySelector("#acct-bio");
  const bioCount = menu.querySelector("#acct-bio-count");
  bioInput.addEventListener("input", () => { bioCount.textContent = bioInput.value.length; });

  menu.querySelector("#acct-save").addEventListener("click", async () => {
    const body = {
      displayName: menu.querySelector("#acct-name").value,
      bio: bioInput.value,
    };
    if (avatarDataUrl) body.avatarUrl = avatarDataUrl;
    const updated = await saveProfile(body);
    if (updated) { toast("Saved"); onChange?.(); close(); }
    else toast("Couldn't save");
  });

  menu.querySelector("#acct-2fa").addEventListener("change", async e => {
    const want = e.target.checked;
    const ok = await toggle2FA(want);
    if (!ok) { e.target.checked = !want; toast("Couldn't update 2FA"); return; }
    toast(want ? "2FA enabled — code will be emailed at next sign-in" : "2FA disabled");
  });

  menu.querySelector("#acct-signout").addEventListener("click", async () => {
    close();
    await logout();
    onChange?.(null);
  });

  // Load friends inline
  (async () => {
    const res = await fetch("/api/friends", { credentials: "same-origin" }).catch(() => null);
    if (!res?.ok) {
      menu.querySelector("#acct-friends-list").innerHTML = `<div style="font-size:12px;color:var(--muted);">Couldn't load friends</div>`;
      return;
    }
    const data = await res.json();
    const count = data.friends?.length ?? 0;
    const incoming = data.incoming?.length ?? 0;

    menu.querySelector("#acct-friends-count").textContent = count;

    // Incoming requests badge
    if (incoming > 0) {
      const reqEl = menu.querySelector("#acct-incoming-requests");
      reqEl.style.display = "block";
      reqEl.innerHTML = data.incoming.map(u => {
        const initial = (u.displayName || u.email || "U")[0].toUpperCase();
        const avatar = u.avatarUrl
          ? `<img src="${u.avatarUrl}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" alt="" />`
          : `<span style="width:28px;height:28px;border-radius:50%;background:rgba(201,161,74,.2);color:var(--gold);display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">${initial}</span>`;
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--glass-border);">
          ${avatar}
          <span style="flex:1;font-size:12px;color:var(--ink);font-weight:500;">${u.displayName || u.email} wants to be friends</span>
          <button data-accept="${u.id}" style="border:none;background:var(--gold);color:#2a1d05;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;cursor:pointer;">Accept</button>
        </div>`;
      }).join("");

      reqEl.querySelectorAll("[data-accept]").forEach(btn => {
        btn.addEventListener("click", async () => {
          btn.textContent = "…";
          btn.disabled = true;
          await fetch("/api/friends", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ targetUserId: btn.dataset.accept, action: "accept" }),
          });
          btn.closest("div[style]").remove();
          toast("Friend added!");
        });
      });
    }

    const listEl = menu.querySelector("#acct-friends-list");
    if (count === 0) {
      listEl.innerHTML = `<div style="font-size:12px;color:var(--muted);">No friends yet — <a href="/friends.html" style="color:var(--gold);">find people</a></div>`;
      return;
    }

    listEl.innerHTML = data.friends.slice(0, 5).map(u => {
      const initial = (u.displayName || u.email || "U")[0].toUpperCase();
      const avatar = u.avatarUrl
        ? `<img src="${u.avatarUrl}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" alt="" />`
        : `<span style="width:28px;height:28px;border-radius:50%;background:rgba(201,161,74,.2);color:var(--gold);display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">${initial}</span>`;
      return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
        ${avatar}
        <span style="font-size:13px;color:var(--ink);font-weight:500;">${u.displayName || u.email}</span>
      </div>`;
    }).join("") + (count > 5 ? `<div style="font-size:11px;color:var(--muted);padding-top:4px;">+${count - 5} more</div>` : "");
  })();
}
