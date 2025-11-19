const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const statusBox = document.getElementById("status");
console.log("Upload script loaded.");

  uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      statusBox.textContent = "Vennligst velg en fil først.";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      statusBox.textContent = "Opplaster...";
      const res = await fetch("/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        throw new Error("Opplastingen mislyktes");
      }
      const data = await res.json().catch(() => ({})); 
      statusBox.textContent = "Opplastingen var vellykket!";
      console.log("Server response:", data);
    } catch (err) {
      console.error(err);
      statusBox.textContent = "Feil ved opplasting av fil.";
    }
  });
