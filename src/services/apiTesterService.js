import axios from "axios";

const API_BASE_URL = "https://api-performance-backend.onrender.com";

export async function testApiRequest(payload) {
  const { data } = await axios.post(`${API_BASE_URL}/test`, payload, {
    timeout: 35000,
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
}
