import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function testApiRequest(payload) {
  const { data } = await axios.post(`${API_BASE_URL}/test`, payload, {
    timeout: 35000,
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return data
}
