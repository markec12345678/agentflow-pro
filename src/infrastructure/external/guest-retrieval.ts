// Guest Retrieval stub
export class GuestRetrieval {
  async retrieve(context: any): Promise<any> {
    return { reservations: [] };
  }
}

export async function retrieveGuestContext(context: any): Promise<any> {
  const retrieval = new GuestRetrieval();
  return retrieval.retrieve(context);
}
