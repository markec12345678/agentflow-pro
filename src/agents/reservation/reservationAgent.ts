// Reservation Agent stub
export class ReservationAgent {
  async process(data: any): Promise<any> {
    return { success: true };
  }
}

export function createReservationAgent(): ReservationAgent {
  return new ReservationAgent();
}
