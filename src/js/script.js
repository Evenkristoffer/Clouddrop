// En veeeeeeeeeeeldig lang script.js................................
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const statusBox = document.getElementById("status");
const messageBox = document.getElementById("message");
const uploadedList = document.getElementById("uploadedFiles");
const loginInfo = document.querySelector(".login-info");
const progressFill = document.getElementById("uploadProgressFill");
const progressLabel = document.getElementById("uploadProgressLabel");
const deleteButtonsSelector = ".uploaded-files__delete";

const API_BASE = window.API_BASE_URL
  ? window.API_BASE_URL
  : window.location.port === "5500"
  ? "http://localhost:3000"
  : window.location.origin;

const userEmail =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("clouddrop.userEmail")
    : null;

if (!userEmail) {
  window.location.href = "/html/login.html";
}

if (loginInfo && userEmail) {
  loginInfo.textContent = `Logged in as: ${userEmail}`;
}

console.log("Upload script loaded.");

function setStatus(message, type) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.classList.remove("success", "error");

  if (type) {
    statusBox.classList.add(type);
  }
}

function setProgress(percent = 0, label = "") {
  const safePercent = Math.min(100, Math.max(0, percent));

  if (progressFill) {
    progressFill.style.width = `${safePercent}%`;
  }

  if (progressLabel) {
    progressLabel.textContent = label || `${Math.round(safePercent)}%`;
  }
}

function renderUploadedFiles(files = []) {
  if (!uploadedList) return;

  uploadedList.innerHTML = "";

  if (!files.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "uploaded-files__empty";
    emptyState.textContent = "No files uploaded yet.";
    uploadedList.appendChild(emptyState);
    return;
  }

  files.forEach((file) => {
    const listItem = document.createElement("li");
    listItem.className = "uploaded-files__item";

    const link = document.createElement("a");
    link.href = file.url;
    link.textContent = file.originalName || file.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const actions = document.createElement("div");
    actions.className = "uploaded-files__actions";

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "uploaded-files__delete";
    delBtn.textContent = "Delete";
    delBtn.setAttribute("data-id", file.id);

    actions.appendChild(delBtn);
    listItem.appendChild(link);
    listItem.appendChild(actions);
    uploadedList.appendChild(listItem);
  });
}

async function fetchUploadedFiles() {
  if (!uploadedList) return;

  try {
    const response = await fetch(`${API_BASE}/api/uploads`, {
      headers: {
        "x-user-email": userEmail || ""
      }
    });

    if (!response.ok) {
      if (messageBox) {
        messageBox.textContent = "Could not fetch files.";
      }
      return;
    }

    const files = await response.json();
    renderUploadedFiles(files);

    if (messageBox) {
      messageBox.textContent = "";
    }
  } catch (error) {
    console.error(error);
    if (messageBox) {
      messageBox.textContent = "Could not fetch uploaded files.";
    }
  }
}

if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", () => {
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      setStatus("Please select a file first.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading...", null);
    setProgress(0, "Starting...");
    uploadBtn.disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/upload`);
    xhr.setRequestHeader("x-user-email", userEmail || "");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = (event.loaded / event.total) * 100;
        setProgress(percent, `Uploading ${Math.round(percent)}%`);
      }
    };

    xhr.onerror = () => {
      setStatus("Error uploading file.", "error");
      setProgress(0, "Upload failed");
      uploadBtn.disabled = false;
    };

    xhr.onload = async () => {
      uploadBtn.disabled = false;

      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100, "Upload complete");
        setStatus("Upload was successful!", "success");
        fileInput.value = "";

        try {
          await fetchUploadedFiles();
        } catch (err) {
          console.error(err);
        }
      } else {
        console.error("Upload failed:", xhr.statusText || xhr.responseText);
        setStatus("Error uploading file.", "error");
        setProgress(0, "Upload failed");
      }
    };

    xhr.send(formData);
  });
}

fetchUploadedFiles();

if (uploadedList) {
  uploadedList.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) return;
    if (!target.matches(deleteButtonsSelector)) return;

    const id = target.getAttribute("data-id");
    if (!id) return;

    try {
      target.disabled = true;
      setStatus("Deleting file...", null);

      const res = await fetch(`${API_BASE}/api/uploads/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-email": userEmail || ""
        }
      });

      if (!res.ok) {
        setStatus("Could not delete file.", "error");
        return;
      }

      setStatus("File deleted.", "success");
      await fetchUploadedFiles();
    } catch (err) {
      console.error(err);
      setStatus("Could not delete file.", "error");
    } finally {
      target.disabled = false;
    }
  });
}
