/**
 * AJPES eTurizem SOAP client – oddaja knjige gostov.
 * WSDL: https://www.ajpes.si/wsrno/eTurizem/wsETurizemPorocanje.asmx?WSDL
 * 
 * Error codes:
 * - ETURIZEM_001: Invalid credentials
 * - ETURIZEM_002: Invalid RNO ID
 * - ETURIZEM_003: Invalid XML format
 * - ETURIZEM_004: Duplicate submission
 * - ETURIZEM_005: Network error
 * - ETURIZEM_006: SOAP fault
 */

import * as Sentry from "@sentry/nextjs";

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

export interface SubmitResult {
  success: boolean;
  message?: string;
  raw?: string;
  errorCode?: string;
  retryable?: boolean;
}

export interface EturizemError {
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
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
 * Validate eTurizem row data
 */
function validateEturizemRow(row: EturizemRow): EturizemError | null {
  // Required fields
  if (!row.ime || !row.pri) {
    return {
      code: "ETURIZEM_VALIDATION_001",
      message: "Ime in priimek sta obvezna",
      retryable: false,
    };
  }

  // Date format validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(row.dtRoj)) {
    return {
      code: "ETURIZEM_VALIDATION_002",
      message: "Datum rojstva mora biti v formatu YYYY-MM-DD",
      retryable: false,
    };
  }

  // Country code validation (ISO 3166-1 alpha-2)
  if (!/^[A-Z]{2}$/.test(row.drzava)) {
    return {
      code: "ETURIZEM_VALIDATION_003",
      message: "Država mora biti ISO 2-črkovna koda (npr. SI, HR, DE)",
      retryable: false,
    };
  }

  // Document type validation
  const validDocTypes = ["F", "H", "I", "O", "P", "U", "V", "L"];
  if (!validDocTypes.includes(row.vrstaDok)) {
    return {
      code: "ETURIZEM_VALIDATION_004",
      message: "Neveljavna vrsta dokumenta",
      details: `Veljavne vrednosti: ${validDocTypes.join(", ")}`,
      retryable: false,
    };
  }

  // Document ID validation
  if (!row.idStDok || row.idStDok.trim().length === 0) {
    return {
      code: "ETURIZEM_VALIDATION_005",
      message: "Številka dokumenta je obvezna",
      retryable: false,
    };
  }

  // Gender validation
  if (!["M", "F"].includes(row.sp)) {
    return {
      code: "ETURIZEM_VALIDATION_006",
      message: "Spol mora biti M ali F",
      retryable: false,
    };
  }

  // Arrival date validation
  if (!dateRegex.test(row.casPrihoda.split("T")[0])) {
    return {
      code: "ETURIZEM_VALIDATION_007",
      message: "Datum prihoda mora biti v formatu YYYY-MM-DD",
      retryable: false,
    };
  }

  return null;
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

/**
 * Parse SOAP fault and return structured error
 */
function parseSoapFault(soapResponse: string): EturizemError {
  // Try to extract fault message
  const faultMatch = soapResponse.match(/<faultstring[^>]*>([^<]+)</);
  const faultCode = soapResponse.match(/<faultcode[^>]*>([^<]+)</);
  
  const message = faultMatch ? faultMatch[1] : "Neznana napaka AJPES";
  const code = faultCode ? faultCode[1] : "ETURIZEM_SOAP_UNKNOWN";

  // Check for specific error patterns
  if (message.includes("napačno uporabniško ime") || message.includes("invalid username")) {
    return {
      code: "ETURIZEM_001",
      message: "Napačno uporabniško ime za AJPES",
      details: message,
      retryable: false,
    };
  }

  if (message.includes("napačno geslo") || message.includes("invalid password")) {
    return {
      code: "ETURIZEM_001",
      message: "Napačno geslo za AJPES",
      details: message,
      retryable: false,
    };
  }

  if (message.includes("RNO") || message.includes("ID obrata")) {
    return {
      code: "ETURIZEM_002",
      message: "Neveljaven RNO ID nastanitvenega obrata",
      details: message,
      retryable: false,
    };
  }

  if (message.includes("XML") || message.includes("format") || message.includes("shema")) {
    return {
      code: "ETURIZEM_003",
      message: "Neveljaven XML format",
      details: message,
      retryable: false,
    };
  }

  if (message.includes("duplikat") || message.includes("already exists")) {
    return {
      code: "ETURIZEM_004",
      message: "Podatek že obstaja v registru",
      details: message,
      retryable: false,
    };
  }

  // Default: network or server error (retryable)
  return {
    code: code.includes("Client") ? "ETURIZEM_005" : "ETURIZEM_006",
    message: message,
    details: soapResponse.substring(0, 500),
    retryable: code.includes("Server") || code.includes("Timeout"),
  };
}

/**
 * Submit guest book data to AJPES wsETurizemPorocanje with retry logic.
 */
export async function submitToAjpes(
  username: string,
  password: string,
  xmlData: string,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    propertyId?: string;
    reservationId?: string;
  }
): Promise<SubmitResult> {
  const { maxRetries = 2, retryDelay = 2000, propertyId, reservationId } = options || {};
  
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

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(WSDL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: '"http://www.ajpes.si/wsrno/eturizem/oddajPorocilo"',
        },
        body: soapEnv,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await res.text();

      // HTTP error
      if (!res.ok) {
        const error = parseSoapFault(text);
        
        // Log to Sentry
        Sentry.captureException(new Error(`eTurizem HTTP Error: ${error.message}`), {
          tags: {
            component: "eturizem-client",
            error_code: error.code,
            property_id: propertyId,
          },
          extra: {
            http_status: res.status,
            retryable: error.retryable,
            attempt: attempt + 1,
            max_retries: maxRetries,
          },
        });

        // Retry only if retryable
        if (error.retryable && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          attempt++;
          continue;
        }

        return {
          success: false,
          message: error.message,
          errorCode: error.code,
          retryable: error.retryable,
        };
      }

      // Check for SOAP fault
      if (text.includes("soap:Fault") || text.includes("faultcode")) {
        const error = parseSoapFault(text);
        
        // Log to Sentry
        Sentry.captureException(new Error(`eTurizem SOAP Fault: ${error.message}`), {
          tags: {
            component: "eturizem-client",
            error_code: error.code,
            property_id: propertyId,
          },
          extra: {
            retryable: error.retryable,
            attempt: attempt + 1,
            max_retries: maxRetries,
          },
        });

        // Retry only if retryable
        if (error.retryable && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          attempt++;
          continue;
        }

        return {
          success: false,
          message: error.message,
          errorCode: error.code,
          retryable: error.retryable,
        };
      }

      // Success
      return {
        success: true,
        message: "Podatki uspešno oddani v AJPES",
        raw: text,
      };

    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Timeout or network error - always retryable
      const isTimeout = lastError.name === "AbortError";
      const isNetworkError = lastError.message.includes("fetch") || 
                             lastError.message.includes("network") ||
                             lastError.message.includes("ENETUNREACH");

      if ((isTimeout || isNetworkError) && attempt < maxRetries) {
        // Log retry attempt
        Sentry.captureMessage(`eTurizem network error, retrying...`, {
          level: "warning",
          tags: {
            component: "eturizem-client",
            error_type: isTimeout ? "timeout" : "network",
            property_id: propertyId,
          },
          extra: {
            attempt: attempt + 1,
            max_retries: maxRetries,
            error: lastError.message,
          },
        });

        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        attempt++;
        continue;
      }

      // Non-retryable error or max retries reached
      break;
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || "Neznana napaka";
  
  Sentry.captureException(lastError || new Error("eTurizem submission failed"), {
    tags: {
      component: "eturizem-client",
      error_code: "ETURIZEM_005",
      property_id: propertyId,
      reservation_id: reservationId,
    },
    extra: {
      max_retries: maxRetries,
      total_attempts: attempt + 1,
      username: username.substring(0, 3) + "***", // Mask username for security
    },
  });

  return {
    success: false,
    message: `Napaka pri povezavi z AJPES: ${errorMessage}`,
    errorCode: "ETURIZEM_005",
    retryable: false,
  };
}

/**
 * Validate and submit single guest row
 */
export async function validateAndSubmit(
  username: string,
  password: string,
  row: EturizemRow,
  options?: {
    propertyId?: string;
    reservationId?: string;
  }
): Promise<SubmitResult> {
  // Validate row
  const validationError = validateEturizemRow(row);
  if (validationError) {
    Sentry.captureException(new Error(`eTurizem validation error: ${validationError.message}`), {
      tags: {
        component: "eturizem-client",
        error_code: validationError.code,
        property_id: options?.propertyId,
      },
      extra: {
        retryable: validationError.retryable,
        row_data: {
          idNO: row.idNO,
          zst: row.zst,
          drzava: row.drzava,
          vrstaDok: row.vrstaDok,
        },
      },
    });

    return {
      success: false,
      message: validationError.message,
      errorCode: validationError.code,
      retryable: validationError.retryable,
    };
  }

  // Build XML and submit
  const xml = buildGuestBookXml([row]);
  return submitToAjpes(username, password, xml, options);
}
