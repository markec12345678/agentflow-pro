/**
 * AJPES eTurizem SOAP client – oddaja knjige gostov.
 * WSDL: https://www.ajpes.si/wsrno/eTurizem/wsETurizemPorocanje.asmx?WSDL
 */

const WSDL_URL =
  process.env.AJPES_ETURIZEM_TEST === "true"
    ? "https://wwwt.ajpes.si/rno/rnoApi/eTurizem/wsETurizemPorocanje.asmx"
    : "https://www.ajpes.si/wsrno/eTurizem/wsETurizemPorocanje.asmx";

export interface EturizemRow {
  idNO: number;
  zst: number;
  ime: string;
  pri: string;
  sp: "M" | "F";
  dtRoj: string; // YYYY-MM-DD
  drzava: string; // ISO 2
  vrstaDok: "F" | "H" | "I" | "O" | "P" | "U" | "V" | "L";
  idStDok: string;
  casPrihoda: string; // YYYY-MM-DDThh:mm:ss
  casOdhoda?: string;
  ttObracun: number; // 0–19
  ttVisina: number;
  status: 1 | 2;
}

function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build knjigaGostov XML string from rows.
 */
export function buildGuestBookXml(rows: EturizemRow[]): string {
  const rowStrs = rows.map((r) => {
    const casOdhoda = r.casOdhoda
      ? ` casOdhoda="${escapeXmlAttr(r.casOdhoda)}"`
      : "";
    return `<row idNO="${r.idNO}" zst="${r.zst}" ime="${escapeXmlAttr(r.ime)}" pri="${escapeXmlAttr(r.pri)}" sp="${r.sp}" dtRoj="${r.dtRoj}" drzava="${escapeXmlAttr(r.drzava)}" vrstaDok="${r.vrstaDok}" idStDok="${escapeXmlAttr(r.idStDok)}" casPrihoda="${escapeXmlAttr(r.casPrihoda)}"${casOdhoda} ttObracun="${r.ttObracun}" ttVisina="${r.ttVisina}" status="${r.status}"/>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><knjigaGostov>${rowStrs.join("")}</knjigaGostov>`;
}

export interface SubmitResult {
  success: boolean;
  message?: string;
  raw?: string;
}

/**
 * Submit guest book data to AJPES wsETurizemPorocanje.
 */
export async function submitToAjpes(
  username: string,
  password: string,
  xmlData: string
): Promise<SubmitResult> {
  const soapEnv = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <oddajPorocilo xmlns="http://www.ajpes.si/wsrno/eturizem">
      <uName>${escapeXmlAttr(username)}</uName>
      <pwd>${escapeXmlAttr(password)}</pwd>
      <data><![CDATA[${xmlData}]]></data>
      <format>1</format>
    </oddajPorocilo>
  </soap:Body>
</soap:Envelope>`;

  try {
    const res = await fetch(WSDL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '"http://www.ajpes.si/wsrno/eturizem/oddajPorocilo"',
      },
      body: soapEnv,
    });

    const text = await res.text();

    if (!res.ok) {
      return { success: false, message: `HTTP ${res.status}: ${text.slice(0, 500)}`, raw: text };
    }

    if (text.includes("soap:Fault") || text.includes("faultcode")) {
      const faultMatch = text.match(/<faultstring[^>]*>([^<]+)</);
      const msg = faultMatch ? faultMatch[1] : "SOAP fault";
      return { success: false, message: msg, raw: text };
    }

    return { success: true, raw: text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg };
  }
}
