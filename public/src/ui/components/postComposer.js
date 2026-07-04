import { toast } from "./toast.js";

const MAX_BYTES = 50 * 1024 * 1024;

export function showPostComposer(onPosted) {
  const overlay = document.createElement("div");
  overlay.className = "post-overlay";
  overlay.innerHTML = `
    <div class="post-sheet">
      <div class="post-head">
        <h3>New post</h3>
        <button class="post-close" aria-label="Close">×</button>
      </div>
      <label class="post-drop" id="post-drop">
        <div class="post-drop-icon">📎</div>
        <div class="post-drop-text">Tap to add a photo or video</div>
        <div class="post-drop-hint">Max 50 MB</div>
        <input type="file" accept="image/*,video/*" hidden id="post-file" />
      </label>
      <div class="post-preview" id="post-preview" hidden></div>
      <textarea class="post-caption" id="post-caption" rows="3" maxlength="1000" placeholder="What's on your heart?"></textarea>
      <div class="post-actions">
        <button class="post-cancel">Cancel</button>
        <button class="post-submit" disabled>Post</button>
      </div>
      <div class="post-progress" id="post-progress" hidden>
        <div class="post-progress-bar"><div class="post-progress-fill" id="post-progress-fill"></div></div>
        <div class="post-progress-text" id="post-progress-text">Uploading…</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const fileInput = overlay.querySelector("#post-file");
  const preview = overlay.querySelector("#post-preview");
  const drop = overlay.querySelector("#post-drop");
  const caption = overlay.querySelector("#post-caption");
  const submit = overlay.querySelector(".post-submit");
  const progress = overlay.querySelector("#post-progress");
  const progressFill = overlay.querySelector("#post-progress-fill");
  const progressText = overlay.querySelector("#post-progress-text");

  let chosenFile = null;
  let videoThumbnailDataUrl = null;
  const refreshSubmit = () => {
    submit.disabled = !chosenFile && !caption.value.trim();
  };

  // Capture the first frame of a video as a JPEG thumbnail (client-side).
  // The server stores it alongside the video so feeds can show a preview
  // without forcing every device to download the full file.
  async function captureVideoThumbnail(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = url;
      const cleanup = () => URL.revokeObjectURL(url);
      video.addEventListener("loadeddata", () => {
        try {
          // Seek a tiny bit past 0 so we get an actual frame, not black
          video.currentTime = Math.min(0.3, (video.duration || 1) / 4);
        } catch { resolve(null); cleanup(); }
      });
      video.addEventListener("seeked", () => {
        try {
          const maxW = 480;
          const scale = Math.min(1, maxW / video.videoWidth);
          const w = Math.round(video.videoWidth * scale);
          const h = Math.round(video.videoHeight * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(video, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        } catch { resolve(null); }
        cleanup();
      });
      video.addEventListener("error", () => { resolve(null); cleanup(); });
    });
  }

  function showPreview(file) {
    const url = URL.createObjectURL(file);
    preview.hidden = false;
    if (file.type.startsWith("video/")) {
      preview.innerHTML = `<video src="${url}" controls playsinline></video><button class="post-preview-remove">Remove</button>`;
    } else {
      preview.innerHTML = `<img src="${url}" alt="" /><button class="post-preview-remove">Remove</button>`;
    }
    preview.querySelector(".post-preview-remove").addEventListener("click", () => {
      chosenFile = null;
      preview.hidden = true;
      preview.innerHTML = "";
      drop.hidden = false;
      fileInput.value = "";
      refreshSubmit();
    });
    drop.hidden = true;
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) { toast("File too large (max 50 MB)"); fileInput.value = ""; return; }
    chosenFile = file;
    showPreview(file);
    refreshSubmit();
    if (file.type.startsWith("video/")) {
      videoThumbnailDataUrl = await captureVideoThumbnail(file);
    } else {
      videoThumbnailDataUrl = null;
    }
  });

  caption.addEventListener("input", refreshSubmit);

  const close = () => overlay.remove();
  overlay.querySelector(".post-close").addEventListener("click", close);
  overlay.querySelector(".post-cancel").addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

  submit.addEventListener("click", async () => {
    submit.disabled = true;
    progress.hidden = false;
    progressText.textContent = "Uploading…";
    const fd = new FormData();
    if (chosenFile) fd.append("media", chosenFile);
    if (videoThumbnailDataUrl) fd.append("thumbnail", videoThumbnailDataUrl);
    fd.append("caption", caption.value.trim());

    try {
      const res = await uploadWithProgress("/api/posts", fd, pct => {
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `Uploading… ${pct}%`;
      });
      if (!res.ok) {
        const err = JSON.parse(res.body || "{}");
        toast(err.error || "Couldn't post");
        progress.hidden = true;
        submit.disabled = false;
        return;
      }
      toast("Posted ✦");
      close();
      onPosted?.();
    } catch (e) {
      toast(e.message || "Upload failed");
      progress.hidden = true;
      submit.disabled = false;
    }
  });
}

function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: xhr.responseText });
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}
