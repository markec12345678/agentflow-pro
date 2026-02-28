/**
 * POST /api/tourism/eturizem/parse-mrz
 * Parse MRZ lines from passport/ID and return structured guest data.
 * Body: { mrzLines: string[] } - 2 or 3 lines of MRZ
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

type MrzResult = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentId: string;
  countryCode: string;
  documentType: string;
  gender: "M" | "F";
};

function parseMrzFallback(lines: string[]): MrzResult | null {
  if (lines.length < 2) return null;
  const line1 = lines[0]?.replace(/[\s]/g, "") ?? "";
  const line2 = lines[1]?.replace(/[\s]/g, "") ?? "";
  const line3 = lines[2]?.replace(/[\s]/g, "") ?? "";

  let documentId = "";
  let dateOfBirth = "";
  let gender: "M" | "F" = "M";
  let countryCode = "";
  let lastName = "";
  let firstName = "";

  if (line1.startsWith("P") || line1.startsWith("I") || line1.startsWith("V")) {
    documentId = (line1.slice(5, 14) ?? "").replace(/</g, "").trim();
    const dobSlice = line2.slice(0, 6);
    if (dobSlice && /^\d{6}$/.test(dobSlice)) {
      const yy = dobSlice.slice(0, 2);
      const mm = dobSlice.slice(2, 4);
      const dd = dobSlice.slice(4, 6);
      const yyyy = parseInt(yy, 10) < 30 ? `20${yy}` : `19${yy}`;
      dateOfBirth = `${yyyy}-${mm}-${dd}`;
    }
    const g = line2[7];
    gender = g === "F" ? "F" : "M";
    countryCode = (line2.slice(10, 13) ?? "").replace(/</g, "").trim();
    const namePart = line3 ?? "";
    const parts = namePart.split("<<");
    lastName = (parts[0] ?? "").replace(/</g, " ").trim();
    firstName = (parts[1] ?? "").replace(/</g, " ").trim();
  } else if (line1.length >= 30 && line2.length >= 30) {
    documentId = (line1.slice(5, 14) ?? "").replace(/</g, "").trim();
    const dobSlice = line1.slice(13, 19);
    if (dobSlice && /^\d{6}$/.test(dobSlice)) {
      const yy = dobSlice.slice(0, 2);
      const mm = dobSlice.slice(2, 4);
      const dd = dobSlice.slice(4, 6);
      const yyyy = parseInt(yy, 10) < 30 ? `20${yy}` : `19${yy}`;
      dateOfBirth = `${yyyy}-${mm}-${dd}`;
    }
    const g = line1[20];
    gender = g === "F" ? "F" : "M";
    countryCode = (line1.slice(15, 18) ?? "").replace(/</g, "").trim();
    const namePart = line2 ?? "";
    const nameParts = namePart.split("<<");
    lastName = (nameParts[0] ?? "").replace(/</g, " ").trim();
    firstName = (nameParts[1] ?? "").replace(/</g, " ").trim();
  }

  if (!firstName && !lastName && !documentId) return null;
  return {
    firstName,
    lastName,
    dateOfBirth: dateOfBirth || "",
    documentId,
    countryCode: countryCode || "",
    documentType: "P",
    gender,
  };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { mrzLines?: string[] };
  const lines = Array.isArray(body.mrzLines)
    ? body.mrzLines.map((l) => String(l ?? "").trim()).filter(Boolean)
    : [];

  if (lines.length < 2) {
    return NextResponse.json(
      { error: "mrzLines must have at least 2 lines (passport/ID MRZ)" },
      { status: 400 }
    );
  }

  let result: MrzResult | null = null;

  try {
    const mrz = await import("mrz");
    const parse = typeof mrz.parse === "function" ? mrz.parse : null;
    if (parse) {
      const parsed = parse(lines) as {
        names?: string[];
        surname?: string;
        sex?: string;
        birthDate?: { year?: number; month?: number; day?: number };
        documentNumber?: string;
        nationality?: string;
        valid?: boolean;
      };
      if (parsed) {
        const names = parsed.names ?? [];
        const surname = parsed.surname ?? "";
        const firstName = names.join(" ") || "";
        const dob = parsed.birthDate;
        const dobStr =
          dob?.year && dob?.month && dob?.day
            ? `${dob.year}-${String(dob.month).padStart(2, "0")}-${String(dob.day).padStart(2, "0")}`
            : "";
        const g = parsed.sex === "female" ? "F" : "M";
        result = {
          firstName,
          lastName: surname,
          dateOfBirth: dobStr,
          documentId: parsed.documentNumber ?? "",
          countryCode: parsed.nationality ?? "",
          documentType: "P",
          gender: g,
        };
      }
    }
  } catch {
    // mrz package not installed or parse failed – use fallback
  }

  if (!result) {
    result = parseMrzFallback(lines);
  }

  if (!result) {
    return NextResponse.json(
      { error: "Could not parse MRZ. Check format (2-3 lines, 44 chars each)." },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
