const API_BASE_URL = "https://api-conectodonto.com.br/api" //"http://localhost:8080/api"; 

export const asaasApi = {
  createPayment: async (paymentData: {
    customer: { name: string; email: string; cpfCnpj: string }
    billingType: string
    value: number
    dueDate: string
    description: string
  }) => {
    const res = await fetch(`${API_BASE_URL}/asaas/create-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  checkPayment: async (paymentId: string) => {
    const res = await fetch(`${API_BASE_URL}/asaas/check-payment/${paymentId}`, {
      method: "GET",
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  webhook: async (webhookData: any) => {
    const res = await fetch(`${API_BASE_URL}/asaas/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookData),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
}
