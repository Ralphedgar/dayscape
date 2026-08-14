// ── cloudinary.js ──

const CLOUD_NAME   = "CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@djipggbf";    // ← remplace
const UPLOAD_PRESET = "dayscape-uploads"; // ← remplace si différent

// ── Upload d'une image vers Cloudinary ──
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "dayscape");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Upload Cloudinary échoué");

  const data = await res.json();
  return data.secure_url; // URL publique de l'image
}
