// Eturizem client stub
export class EturizemClient {
  async submitCheckIn(data: any): Promise<any> {
    return { success: true };
  }

  async buildGuestBookXml(data: any): Promise<string> {
    return '<?xml version="1.0"?><guestbook></guestbook>';
  }

  async submitToAjpes(xml: string): Promise<boolean> {
    return true;
  }
}

export async function buildGuestBookXml(data: any): Promise<string> {
  const client = new EturizemClient();
  return client.buildGuestBookXml(data);
}

export async function submitToAjpes(xml: string): Promise<boolean> {
  const client = new EturizemClient();
  return client.submitToAjpes(xml);
}
