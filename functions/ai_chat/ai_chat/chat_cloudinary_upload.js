export function uploadCloudinaryAsset({
  file,
  cloudName,
  uploadPreset,
  resourceType,
  publicId,
  onProgress,
  onRequest,
  timeoutMs = 90_000
}) {
  if (!["image", "video", "raw"].includes(resourceType)) {
    return Promise.reject(Error("Unsupported Cloudinary resource type."));
  }

  if (!file || !cloudName || !uploadPreset) {
    return Promise.reject(
      Error("Cloudinary upload configuration or file is missing.")
    );
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("upload_preset", uploadPreset);
    if (publicId) form.append("public_id", publicId);
    form.append("file", file, file.name);

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`
    );
    xhr.timeout = timeoutMs;

    xhr.upload.addEventListener("progress", event => {
      onProgress?.(
        event.loaded,
        event.lengthComputable ? event.total : 0
      );
    });

    xhr.addEventListener("load", () => {
      let response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch {
        const detail = String(xhr.responseText || "")
          .trim()
          .slice(0, 500);
        reject(
          Error(
            `Cloudinary returned an unreadable response (HTTP ${xhr.status})${
              detail ? `: ${detail}` : "."
            }`
          )
        );
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const providerMessage =
          response?.error?.message ||
          response?.message ||
          "No provider error message was returned.";
        reject(
          Error(
            `Cloudinary upload failed with HTTP ${xhr.status}${
              response?.error?.http_code
                ? ` (${response.error.http_code})`
                : ""
            }: ${providerMessage}`
          )
        );
        return;
      }

      if (
        typeof response.secure_url !== "string" ||
        !response.secure_url.startsWith("https://") ||
        typeof response.public_id !== "string" ||
        !response.public_id
      ) {
        reject(
          Error("Cloudinary did not return a secure URL and public ID.")
        );
        return;
      }

      resolve({
        secureUrl: response.secure_url,
        publicId: response.public_id,
        bytes:
          Number.isSafeInteger(response.bytes) && response.bytes >= 0
            ? response.bytes
            : file.size,
        format:
          typeof response.format === "string"
            ? response.format
            : null
      });
    }, { once: true });

    xhr.addEventListener("error", () => {
      reject(
        Error(
          "Could not reach Cloudinary. Check the upload preset and browser network/CORS errors, then retry."
        )
      );
    }, { once: true });

    xhr.addEventListener("timeout", () => {
      reject(
        Error(
          `Cloudinary upload timed out after ${Math.round(timeoutMs / 1000)} seconds. Retry the upload.`
        )
      );
    }, { once: true });

    xhr.addEventListener("abort", () => {
      const exception = Error("Cloudinary upload was canceled.");
      exception.name = "AbortError";
      reject(exception);
    }, { once: true });

    if (onRequest?.(xhr) === false) {
      const exception = Error("Cloudinary upload was canceled.");
      exception.name = "AbortError";
      reject(exception);
      return;
    }

    xhr.send(form);
  });
}
