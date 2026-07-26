/**
 * Convert a data URL to a File without using fetch() —
 * fetch(data:) throws NetworkError in some mobile browsers.
 */
export function dataUrlToFile(dataUrl: string, filename: string = "catch.jpg"): File {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Invalid image data");
  }

  const header = dataUrl.slice(0, commaIndex);
  const data = dataUrl.slice(commaIndex + 1);
  const mimeMatch = header.match(/data:(.*?);/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const isBase64 = /;base64/i.test(header);

  let bytes: Uint8Array;
  if (isBase64) {
    const binary = atob(data);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
  } else {
    const decoded = decodeURIComponent(data);
    bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i += 1) {
      bytes[i] = decoded.charCodeAt(i);
    }
  }

  return new File([bytes.buffer as ArrayBuffer], filename, { type: mime });
}

export async function uploadCatchImage(options: {
  imageFile?: File | null;
  imageData?: string | null;
  filename?: string;
}): Promise<string> {
  const { imageFile, imageData, filename = "catch.jpg" } = options;

  let file: File | null = imageFile ?? null;

  if (!file && imageData) {
    if (imageData.startsWith("data:")) {
      file = dataUrlToFile(imageData, filename);
    } else if (imageData.startsWith("blob:")) {
      const response = await fetch(imageData);
      const blob = await response.blob();
      file = new File([blob], filename, { type: blob.type || "image/jpeg" });
    } else {
      // Already an uploaded URL (/uploads/..., https://...)
      return imageData;
    }
  }

  if (!file) {
    throw new Error("No image to upload");
  }

  const formData = new FormData();
  formData.append("file", file, file.name || filename);

  const uploadResponse = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse
      .json()
      .catch(() => ({ error: "Upload failed" }));
    throw new Error(errorData.error || "Failed to upload image");
  }

  const uploadData = (await uploadResponse.json()) as { url?: string };
  if (!uploadData.url) {
    throw new Error("Upload failed");
  }

  return uploadData.url;
}
