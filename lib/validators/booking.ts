export function validateBookingPayload(body: any) {
  const errors: string[] = [];

  if (!body.unitId) errors.push("El campo unitId es obligatorio");
  if (!body.guest) errors.push("El objeto guest es obligatorio");
  if (!body.checkInDate) errors.push("El campo checkInDate es obligatorio");
  if (!body.checkOutDate) errors.push("El campo checkOutDate es obligatorio");

  if (body.guest) {
    if (!body.guest.email) errors.push("El campo guest.email es obligatorio");
    if (!body.guest.fullName) errors.push("El campo Nombre es obligatorio");
  }

  return errors;
}