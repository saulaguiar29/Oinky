import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "../constants";

export async function uploadGoalImage(
  localUri: string,
  goalId: string,
  token: string,
): Promise<string> {
  const imageBase64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });

  const res = await fetch(`${API_BASE_URL}/goals/${goalId}/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Image upload failed");
  return data.imageUrl;
}
