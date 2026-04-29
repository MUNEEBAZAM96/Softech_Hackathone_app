import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type ReceiptImageSource = "camera" | "gallery";

export type PreparedReceiptImage = {
  uri: string;
  mimeType: string;
  imageBase64: string;
};

export type PickReceiptImageResult =
  | { ok: true; image: PreparedReceiptImage }
  | { ok: false; reason: "cancelled" | "permission_denied" | "error"; message: string };

const MAX_WIDTH = 1280;
const COMPRESS = 0.72;

function normalizeMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function ensurePermission(source: ReceiptImageSource): Promise<boolean> {
  if (source === "camera") {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    return p.granted;
  }
  const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return p.granted;
}

async function pickRawImage(source: ReceiptImageSource): Promise<ImagePicker.ImagePickerResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: COMPRESS,
    allowsEditing: false,
    exif: false,
    base64: false,
  };
  if (source === "camera") {
    return ImagePicker.launchCameraAsync(options);
  }
  return ImagePicker.launchImageLibraryAsync(options);
}

export async function pickAndPrepareReceiptImage(
  source: ReceiptImageSource
): Promise<PickReceiptImageResult> {
  try {
    const granted = await ensurePermission(source);
    if (!granted) {
      return {
        ok: false,
        reason: "permission_denied",
        message:
          source === "camera"
            ? "Camera permission is required to scan receipts."
            : "Media library permission is required to choose a receipt image.",
      };
    }

    const result = await pickRawImage(source);
    if (result.canceled || !result.assets?.[0]?.uri) {
      return { ok: false, reason: "cancelled", message: "Image selection cancelled." };
    }

    const picked = result.assets[0];
    const resized = await ImageManipulator.manipulateAsync(
      picked.uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG }
    );

    const imageBase64 = await FileSystem.readAsStringAsync(resized.uri, {
      encoding: "base64",
    });

    return {
      ok: true,
      image: {
        uri: resized.uri,
        imageBase64,
        mimeType: picked.mimeType ?? normalizeMimeType(resized.uri),
      },
    };
  } catch {
    return {
      ok: false,
      reason: "error",
      message: "Could not process this image. Please try another receipt.",
    };
  }
}
