/**
 * Tourism Content Generator API - AgentFlow Pro Core integration
 * POST: generates booking, email, landing, seo from hotel_data via Python Core
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CORE_PATH =
  process.env.AGENTFLOW_CORE_PATH ??
  (process.platform === "win32" ? "C:\\Users\\admin\\AgentFlow_Pro_Core" : "/opt/AgentFlow_Pro_Core");

type HotelData = {
  hotel_name: string;
  location: string;
  features: string[];
  current_offer?: string;
  target_audience?: string;
};

type GenerateResult = {
  booking?: Record<string, string>;
  email?: Record<string, string>;
  landing?: Record<string, string>;
  seo?: Record<string, { meta_title: string; meta_description: string; keywords: string[]; og_title: string; og_description: string }>;
};

function runCore(hotelData: HotelData, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dataPath = path.join(outputDir, "hotel_data.json");
    fs.writeFileSync(dataPath, JSON.stringify(hotelData, null, 2), "utf-8");

    const scriptPath = path.join(CORE_PATH, "agent_engine.py");
    const python = process.platform === "win32" ? "python" : "python3";
    const proc = spawn(python, [scriptPath, dataPath, outputDir], {
      cwd: CORE_PATH,
    });

    let stderr = "";
    proc.stderr?.on("data", (d) => { stderr += d.toString(); });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr || `Process exited with code ${code}`));
      else resolve();
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      hotel_data?: HotelData;
      agents?: string[];
      languages?: string[];
      saveToDb?: boolean;
      propertyId?: string | null;
    };

    const hotelData = body.hotel_data;
    if (!hotelData?.hotel_name || !hotelData?.location || !Array.isArray(hotelData?.features)) {
      return NextResponse.json(
        { error: "hotel_data must include hotel_name, location, features" },
        { status: 400 }
      );
    }

    const agents = body.agents ?? ["booking", "email", "landing", "seo"];
    const languages = body.languages ?? ["SL", "EN", "DE", "IT"];

    const scriptPath = path.join(CORE_PATH, "agent_engine.py");
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: "AGENTFLOW_CORE_PATH not configured or agent_engine.py not found. Set AGENTFLOW_CORE_PATH in .env" },
        { status: 503 }
      );
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentflow-"));
    try {
      await runCore(hotelData, tmpDir);
    } catch (err) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Core execution failed" },
        { status: 500 }
      );
    }

    const result: GenerateResult = {};

    if (agents.includes("booking")) {
      result.booking = {};
      for (const lang of languages) {
        const p = path.join(tmpDir, `booking_${lang}.txt`);
        if (fs.existsSync(p)) result.booking![lang] = fs.readFileSync(p, "utf-8");
      }
    }
    if (agents.includes("email")) {
      result.email = {};
      for (const lang of languages) {
        const p = path.join(tmpDir, `email_${lang}.txt`);
        if (fs.existsSync(p)) result.email![lang] = fs.readFileSync(p, "utf-8");
      }
    }
    if (agents.includes("landing")) {
      result.landing = {};
      for (const lang of languages) {
        const p = path.join(tmpDir, `landing_${lang}.html`);
        if (fs.existsSync(p)) result.landing![lang] = fs.readFileSync(p, "utf-8");
      }
    }
    if (agents.includes("seo")) {
      result.seo = {};
      for (const lang of languages) {
        const p = path.join(tmpDir, `seo_${lang}.json`);
        if (fs.existsSync(p)) {
          result.seo![lang] = JSON.parse(fs.readFileSync(p, "utf-8"));
        }
      }
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });

    if (body.saveToDb && result.landing && result.seo) {
      const firstLang = Object.keys(result.landing)[0] ?? "SL";
      const firstSeo = result.seo[firstLang] ?? result.seo.SL ?? Object.values(result.seo)[0];
      const content = { htmlByLang: result.landing };
      const page = await prisma.landingPage.create({
        data: {
          userId,
          title: hotelData.hotel_name,
          content,
          template: "hotel-core",
          languages: Object.keys(result.landing),
          seoTitle: firstSeo?.meta_title ?? null,
          seoDescription: firstSeo?.meta_description ?? null,
          propertyId: body.propertyId?.trim() || null,
        },
      });
      if (firstSeo?.keywords?.length) {
        for (const kw of firstSeo.keywords.slice(0, 10)) {
          if (!kw?.trim()) continue;
          await prisma.seoMetric.create({
            data: { userId, contentType: "landing", contentId: page.id, keyword: kw.trim() },
          });
        }
      }
      return NextResponse.json({ success: true, ...result, savedPageId: page.id });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
