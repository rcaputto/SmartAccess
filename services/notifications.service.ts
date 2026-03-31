export function buildPreCheckinMessage(data: {
  guestName: string;
  propertyName: string;
  propertyAddress: string;
  unitName: string;
  checkInDate: Date;
  checkOutDate: Date;
  accessCode: string;
}) {
  const checkInTime = "15:00";
  const checkOutTime = "11:00";

  return `Hola ${data.guestName} 👋

Te recordamos tu estancia en ${data.propertyName} (${data.unitName})

📍 Dirección:
${data.propertyAddress}

📅 Fechas:
Check-in: ${formatDate(data.checkInDate)} a partir de ${checkInTime}
Check-out: ${formatDate(data.checkOutDate)} antes de ${checkOutTime}

🔐 Código de acceso:
${data.accessCode}

Este código será válido durante tu estancia.

Si tienes cualquier problema, puedes contactarnos.

¡Que disfrutes tu estancia! 😊`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-ES");
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
) {
  console.log("====================================");
  console.log("📲 WHATSAPP MOCK SEND");
  console.log("To:", phone);
  console.log("Message:");
  console.log(message);
  console.log("====================================");

  // futuro:
  // await twilio.messages.create(...)
}