// WhatsApp Business API Integration
const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"

interface WhatsAppMessage {
  to: string
  type: "template" | "text"
  template?: {
    name: string
    language: { code: string }
    components: Array<{
      type: string
      parameters: Array<{ type: string; text: string }>
    }>
  }
  text?: {
    body: string
  }
}

export class WhatsAppAPI {
  private accessToken: string
  private phoneNumberId: string

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
  }

  async sendMessage(message: WhatsAppMessage): Promise<any> {
    const response = await fetch(`${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API Error: ${response.statusText}`)
    }

    return response.json()
  }

  async sendAppointmentReminder(phoneNumber: string, patientName: string, date: string, time: string): Promise<any> {
    const message: WhatsAppMessage = {
      to: phoneNumber,
      type: "text",
      text: {
        body: `Olá ${patientName}, lembramos que você tem consulta agendada para ${date} às ${time}. Confirme sua presença respondendo SIM.`,
      },
    }

    return this.sendMessage(message)
  }

  async sendPaymentReminder(phoneNumber: string, patientName: string, amount: string): Promise<any> {
    const message: WhatsAppMessage = {
      to: phoneNumber,
      type: "text",
      text: {
        body: `Olá ${patientName}, você possui um pagamento pendente de R$ ${amount}. Entre em contato para regularizar.`,
      },
    }

    return this.sendMessage(message)
  }

  // Webhook handler para receber respostas
  static handleWebhook(body: any, verifyToken: string) {
    // Verificação do webhook
    if (body.hub?.mode === "subscribe" && body.hub?.verify_token === verifyToken) {
      return body.hub.challenge
    }

    // Processar mensagens recebidas
    if (body.object === "whatsapp_business_account") {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === "messages") {
            const messages = change.value.messages
            messages?.forEach((message: any) => {
              console.log("Mensagem recebida:", message)
              // Processar resposta do paciente
              // Exemplo: confirmar consulta, responder dúvidas, etc.
            })
          }
        })
      })
    }

    return "OK"
  }
}

export const whatsappApi = {
  async sendAppointmentNotification(messageData: {
    to: string
    type: "create" | "update" | "reminder"
    appointmentData: {
      patientName: string
      date: string
      time: string
      procedure: string
      dentist: string
      duration: number
      observations?: string
    }
    settings: {
      sendNotification: boolean
      sendReminder: boolean
      allowConfirmation: boolean
    }
  }) {
    const config = JSON.parse(localStorage.getItem("whatsappSettings") || "{}")

    if (!config.enabled || !config.accessToken || !config.phoneNumberId) {
      throw new Error("WhatsApp não configurado")
    }

    const api = new WhatsAppAPI(config.accessToken, config.phoneNumberId)
    const { appointmentData, type, settings } = messageData

    let messageText = ""

    switch (type) {
      case "create":
        messageText = `🦷 *OdontoCareSys - Agendamento Confirmado*

Olá ${appointmentData.patientName}!

Sua consulta foi agendada com sucesso:

📅 *Data:* ${appointmentData.date}
🕐 *Horário:* ${appointmentData.time}
⏱️ *Duração:* ${appointmentData.duration} minutos
👨‍⚕️ *Dentista:* ${appointmentData.dentist}
🔧 *Procedimento:* ${appointmentData.procedure}

${appointmentData.observations ? `📝 *Observações:* ${appointmentData.observations}\n` : ""}
${settings.allowConfirmation ? "Para confirmar sua presença, responda *SIM*.\nPara cancelar, responda *CANCELAR*.\n" : ""}
Em caso de dúvidas, entre em contato conosco.

Aguardamos você! 😊`
        break

      case "update":
        messageText = `🦷 *OdontoCareSys - Agendamento Alterado*

Olá ${appointmentData.patientName}!

Sua consulta foi reagendada:

📅 *Nova Data:* ${appointmentData.date}
🕐 *Novo Horário:* ${appointmentData.time}
⏱️ *Duração:* ${appointmentData.duration} minutos
👨‍⚕️ *Dentista:* ${appointmentData.dentist}
🔧 *Procedimento:* ${appointmentData.procedure}

${appointmentData.observations ? `📝 *Observações:* ${appointmentData.observations}\n` : ""}
${settings.allowConfirmation ? "Para confirmar sua presença, responda *SIM*.\nPara cancelar, responda *CANCELAR*.\n" : ""}
Pedimos desculpas por qualquer inconveniente.

Aguardamos você! 😊`
        break

      case "reminder":
        messageText = `🦷 *OdontoCareSys - Lembrete de Consulta*

Olá ${appointmentData.patientName}!

Lembramos que você tem consulta agendada para amanhã:

📅 *Data:* ${appointmentData.date}
🕐 *Horário:* ${appointmentData.time}
👨‍⚕️ *Dentista:* ${appointmentData.dentist}
🔧 *Procedimento:* ${appointmentData.procedure}

${settings.allowConfirmation ? "Para confirmar sua presença, responda *SIM*.\nPara cancelar, responda *CANCELAR*.\n" : ""}
Aguardamos você! 😊`
        break
    }

    const message = {
      to: messageData.to.replace(/\D/g, ""), // Remove caracteres não numéricos
      type: "text" as const,
      text: {
        body: messageText,
      },
    }

    return api.sendMessage(message)
  },

  async sendBulkReminders(
    appointments: Array<{
      patientPhone: string
      patientName: string
      date: string
      time: string
      procedure: string
      dentist: string
    }>,
  ) {
    const config = JSON.parse(localStorage.getItem("whatsappSettings") || "{}")

    if (!config.enabled || !config.accessToken || !config.phoneNumberId) {
      throw new Error("WhatsApp não configurado")
    }

    const api = new WhatsAppAPI(config.accessToken, config.phoneNumberId)
    const results = []

    for (const appointment of appointments) {
      try {
        const result = await this.sendAppointmentNotification({
          to: appointment.patientPhone,
          type: "reminder",
          appointmentData: {
            patientName: appointment.patientName,
            date: appointment.date,
            time: appointment.time,
            procedure: appointment.procedure,
            dentist: appointment.dentist,
            duration: 60,
          },
          settings: {
            sendNotification: true,
            sendReminder: true,
            allowConfirmation: true,
          },
        })
        results.push({ success: true, appointment, result })
      } catch (error) {
        results.push({ success: false, appointment, error })
      }
    }

    return results
  },

  async processWebhookResponse(webhookData: any) {
    if (webhookData.object === "whatsapp_business_account") {
      const responses = []

      webhookData.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === "messages") {
            const messages = change.value.messages || []

            messages.forEach((message: any) => {
              const phoneNumber = message.from
              const messageText = message.text?.body?.toUpperCase()

              if (messageText === "SIM" || messageText === "CONFIRMAR") {
                responses.push({
                  phone: phoneNumber,
                  action: "confirm",
                  messageId: message.id,
                })
              } else if (messageText === "CANCELAR" || messageText === "NÃO") {
                responses.push({
                  phone: phoneNumber,
                  action: "cancel",
                  messageId: message.id,
                })
              }
            })
          }
        })
      })

      return responses
    }

    return []
  },
}
