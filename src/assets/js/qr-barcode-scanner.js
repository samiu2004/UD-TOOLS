(function () {
  const startBtn = document.getElementById("scannerStartBtn");
  const stopBtn = document.getElementById("scannerStopBtn");
  const fileInput = document.getElementById("scannerFileInput");
  const video = document.getElementById("scannerVideo");
  const result = document.getElementById("scannerResult");
  const tips = document.getElementById("scannerTips");
  const preview = document.getElementById("scannerImagePreview");

  const supportStatus = document.getElementById("scannerSupportStatus");
  const cameraStatus = document.getElementById("scannerCameraStatus");
  const formatStatus = document.getElementById("scannerDetectedFormat");
  const modeStatus = document.getElementById("scannerDetectionMode");

  if (!startBtn || !stopBtn || !fileInput || !video || !result) return;

  let stream = null;
  let animationFrame = null;
  let detector = null;
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d", { willReadFrequently: true });

  const hasBarcodeDetector = "BarcodeDetector" in window;
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  if (hasBarcodeDetector) {
    try {
      detector = new BarcodeDetector({
        formats: [
          "qr_code",
          "ean_13",
          "ean_8",
          "code_128",
          "code_39",
          "upc_a",
          "upc_e",
          "codabar"
        ]
      });
      supportStatus.textContent = "Supported";
    } catch (error) {
      supportStatus.textContent = "Limited";
    }
  } else {
    supportStatus.textContent = "Partial";
  }

  function setTips(html) {
    tips.innerHTML = html;
  }

  function setEmptyState() {
    setTips(
      [
        "<p><strong>Camera support:</strong> Live barcode scanning works best in secure contexts such as HTTPS.</p>",
        "<p><strong>Fallback:</strong> If live barcode detection is unsupported, you can still upload an image with a QR code.</p>",
        "<p><strong>Best results:</strong> Use good lighting, keep the code flat, and avoid blurry photos.</p>"
      ].join("")
    );
  }

  function stopCamera() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    video.srcObject = null;
    cameraStatus.textContent = "Stopped";
  }

  function renderDetection(text, format, mode) {
    result.value = text || "";
    formatStatus.textContent = format || "Unknown";
    modeStatus.textContent = mode || "—";
  }

  async function detectFromVideo() {
    if (!stream || video.readyState < 2) {
      animationFrame = requestAnimationFrame(detectFromVideo);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      if (detector) {
        const barcodes = await detector.detect(canvas);
        if (barcodes && barcodes.length > 0) {
          const first = barcodes[0];
          renderDetection(first.rawValue || "", first.format || "barcode", "Live camera");
          cameraStatus.textContent = "Detected";
          return;
        }
      }

      if (window.jsQR) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (qr) {
          renderDetection(qr.data || "", "qr_code", "Live camera");
          cameraStatus.textContent = "Detected";
          return;
        }
      }
    } catch (error) {
      cameraStatus.textContent = "Error";
    }

    animationFrame = requestAnimationFrame(detectFromVideo);
  }

  async function startCamera() {
    if (!hasMediaDevices) {
      cameraStatus.textContent = "Unsupported";
      setTips(
        "<p><strong>Camera access:</strong> This browser does not support camera scanning here. Use the image upload option instead.</p>"
      );
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      video.srcObject = stream;
      await video.play();

      cameraStatus.textContent = "Scanning";
      modeStatus.textContent = "Live camera";

      setTips(
        [
          "<p><strong>Live scan:</strong> Hold the code steady and keep it fully inside the frame.</p>",
          "<p><strong>Fallback:</strong> If the browser cannot read a barcode live, upload an image file below.</p>"
        ].join("")
      );

      detectFromVideo();
    } catch (error) {
      cameraStatus.textContent = "Denied";
      setTips(
        "<p><strong>Permission:</strong> Camera access was blocked or unavailable. You can still scan a QR code from an uploaded image.</p>"
      );
    }
  }

  function readFileAsImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          resolve(img);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function scanUploadedFile(file) {
    if (!file) return;

    try {
      const img = await readFileAsImage(file);

      preview.innerHTML = `
        <img
          src="${img.src}"
          alt="Uploaded scanner preview"
          width="${img.width}"
          height="${img.height}"
          loading="lazy"
          style="max-width:100%; height:auto; border-radius:12px;"
        />
      `;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      let found = false;

      if (detector) {
        const barcodes = await detector.detect(canvas);
        if (barcodes && barcodes.length > 0) {
          const first = barcodes[0];
          renderDetection(first.rawValue || "", first.format || "barcode", "Uploaded image");
          found = true;
        }
      }

      if (!found && window.jsQR) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (qr) {
          renderDetection(qr.data || "", "qr_code", "Uploaded image");
          found = true;
        }
      }

      if (!found) {
        renderDetection("", "Not found", "Uploaded image");
        result.value = "";
        setTips(
          "<p><strong>No result:</strong> Try a clearer image, crop closer to the code, or use a higher-resolution photo.</p>"
        );
      } else {
        setTips(
          "<p><strong>Upload scan:</strong> The code was decoded from the uploaded image. If live scanning fails, this is the safest fallback.</p>"
        );
      }
    } catch (error) {
      result.value = "";
      formatStatus.textContent = "Error";
      modeStatus.textContent = "Uploaded image";
      setTips(
        "<p><strong>Upload error:</strong> The image could not be processed. Try another PNG or JPG file.</p>"
      );
    }
  }

  startBtn.addEventListener("click", startCamera);
  stopBtn.addEventListener("click", stopCamera);

  fileInput.addEventListener("change", function () {
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      scanUploadedFile(file);
    }
  });

  setEmptyState();

  window.addEventListener("beforeunload", stopCamera);
})();