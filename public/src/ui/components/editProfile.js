import { toast } from "./toast.js";

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
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

export function showEditProfile(currentUser, onSaved) {
  const overlay = document.createElement("div");
  overlay.className = "edit-profile-overlay";
  overlay.innerHTML = `
    <div class="edit-profile-sheet">
      <h3>Edit profile</h3>
      <div class="edit-avatar-row">
        <div class="edit-avatar-preview">
          ${currentUser.avatarUrl ? `<img src="${currentUser.avatarUrl}" alt="" />` : `<span>${(currentUser.displayName || currentUser.email || "A")[0].toUpperCase()}</span>`}
        </div>
        <label class="edit-avatar-btn">
          Choose photo
          <input type="file" accept="image/*" hidden />
        </label>
      </div>
      <label class="edit-field">
        <span>Display name</span>
        <input type="text" name="displayName" maxlength="60" value="${currentUser.displayName || ""}" placeholder="What should we call you?" />
      </label>
      <label class="edit-field">
        <span>Bio</span>
        <textarea name="bio" maxlength="280" rows="3" placeholder="A line about you (optional)">${currentUser.bio || ""}</textarea>
      </label>
      <div class="edit-actions">
        <button class="edit-cancel">Cancel</button>
        <button class="edit-save">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let avatarDataUrl = null;
  const preview = overlay.querySelector(".edit-avatar-preview");
  const fileInput = overlay.querySelector("input[type=file]");
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("Image too large (max 5MB)"); return; }
    avatarDataUrl = await shrinkImage(file);
    preview.innerHTML = `<img src="${avatarDataUrl}" alt="" />`;
  });

  const close = () => overlay.remove();
  overlay.querySelector(".edit-cancel").addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

  overlay.querySelector(".edit-save").addEventListener("click", async () => {
    const body = {
      displayName: overlay.querySelector("[name=displayName]").value,
      bio: overlay.querySelector("[name=bio]").value,
    };
    if (avatarDataUrl) body.avatarUrl = avatarDataUrl;
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast("Profile saved");
      close();
      onSaved?.();
    } else {
      const err = await res.json().catch(() => ({}));
      toast(err.error || "Couldn't save");
    }
  });
}
