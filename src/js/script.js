// En veeeeeeeeeeeldig lang script.js................................
const fileInput = document.getElementById("fileInput");
const statusBox = document.getElementById("status");
const messageBox = document.getElementById("message");
const uploadedList = document.getElementById("uploadedFiles");
const loginInfo = document.querySelector(".login-info");
const dropzone = document.querySelector(".dropzone");
const progressFill = document.getElementById("uploadProgressFill");
const progressLabel = document.getElementById("uploadProgressLabel");
const logoutBtn = document.getElementById("logoutBtn");
const deleteButtonsSelector = ".uploaded-files__delete";
const downloadLinksSelector = ".uploaded-files__link";

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

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("clouddrop.userEmail");
    }
    window.location.href = "/html/login.html";
  });
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
    emptyState.textContent = "It seems you haven't uploaded any files to CloudDrop yet  (or maybe you deleted them all...)";
    uploadedList.appendChild(emptyState);
    return;
  }

  files.forEach((file) => {
    const listItem = document.createElement("li");
    listItem.className = "uploaded-files__item";

    const link = document.createElement("a");
    link.href = file.url;
    link.dataset.filename = file.originalName || file.name || "file";
    link.className = "uploaded-files__link";
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

    const Filesize = file.size || 0;
    if (Filesize > 0) {
      const sizeInfo = document.createElement("span");
      sizeInfo.className = "uploaded-files__size";
      sizeInfo.textContent = ` (${(Filesize / 1024).toFixed(2)} KB)`;
      link.appendChild(sizeInfo);
    }
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

async function uploadFiles(files) {
  const fileArray = Array.from(files || []);

  if (!fileArray.length) {
    setStatus("Please select a file first.", "error");
    return;
  }

  const totalSize = fileArray.reduce((sum, file) => sum + (file.size || 0), 0) || 1;
  let uploadedSoFar = 0;

  setStatus("Uploading...", null);
  setProgress(0, "Starting...");

  try {
    for (const file of fileArray) {
      await new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/upload`);
        xhr.setRequestHeader("x-user-email", userEmail || "");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const overallPercent = ((uploadedSoFar + event.loaded) / totalSize) * 100;
            setProgress(overallPercent, `Uploading ${file.name} (${Math.round(overallPercent)}%)`);
          }
        };

        xhr.onerror = () => reject(new Error("Error uploading file."));

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            uploadedSoFar += file.size || 0;
            setProgress((uploadedSoFar / totalSize) * 100, `Finished ${file.name}`);
            resolve();
          } else {
            reject(new Error(xhr.statusText || "Upload failed."));
          }
        };

        xhr.send(formData);
      });
    }

    setProgress(100, "Upload completed!");
    setStatus("Upload was successful!", "success");
    if (fileInput) {
      fileInput.value = "";
    }
    await fetchUploadedFiles();
  } catch (err) {
    console.error(err);
    setStatus("Error uploading file.", "error");
    setProgress(0, "Upload failed");
  } finally {
    // nothing to re-enable; uploads are automatic
  }
}

if (fileInput) {
  fileInput.addEventListener("change", () => uploadFiles(fileInput.files));
}

fetchUploadedFiles();

if (uploadedList) {
  uploadedList.addEventListener("click", async (event) => {
    const target = event.target;

    if (target instanceof HTMLAnchorElement && target.matches(downloadLinksSelector)) {
      event.preventDefault();

      try {
        setStatus("Preparing download. This may take some time depending on the size of your file...", null);
        const res = await fetch(target.href, {
          headers: {
            "x-user-email": userEmail || ""
          }
        });

        if (!res.ok) {
          setStatus("Could not download file :(((", "error");
          return;
        }

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const filename = target.dataset.filename || "download";

        const tempLink = document.createElement("a");
        tempLink.href = objectUrl;
        tempLink.download = filename;
        document.body.appendChild(tempLink);
        tempLink.click();
        tempLink.remove();
        URL.revokeObjectURL(objectUrl);
        setStatus("Download started :)", "success");
      } catch (err) {
        console.error(err);
        setStatus("Could not download file :(", "error");
      }
      return;
    }

    if (!(target instanceof HTMLButtonElement)) return;
    if (!target.matches(deleteButtonsSelector)) return;

    const id = target.getAttribute("data-id");
    if (!id) return;

    try {
      target.disabled = true;
      setStatus("Deleting file...📂🔥🗑️", null);

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

      setStatus("File deleted successfully.", "success");
      await fetchUploadedFiles();
    } catch (err) {
      console.error(err);
      setStatus("Could not delete file.", "error");
    } finally {
      target.disabled = false;
    }
  });
}

if (dropzone && fileInput) {
  const activateDropzone = () => dropzone.classList.add("dropzone--active");
  const deactivateDropzone = () => dropzone.classList.remove("dropzone--active");

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      activateDropzone();
    });
  });

  ["dragleave", "dragend"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      deactivateDropzone();
    });
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    deactivateDropzone();

    const files = event.dataTransfer?.files;
    if (!files || !files.length) {
      setStatus("No files detected in drop.", "error");
      return;
    }

    const dt = new DataTransfer();
    Array.from(files).forEach((file) => dt.items.add(file));
    fileInput.files = dt.files;
    uploadFiles(files);
  });
}

