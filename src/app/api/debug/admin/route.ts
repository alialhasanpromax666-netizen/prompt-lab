import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@promptlab.com";
const ADMIN_PASSWORD = "Admin@123456";
const SEED_SECRET = process.env.SEED_SECRET ?? "prompt-lab-seed-2026";

function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}

export async function GET(request: Request) {
  const auth = request.headers.get("x-seed-secret") ?? "";
  if (auth !== SEED_SECRET) return unauthorized();

  try {
    const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود في DB" }, { status: 404 });
    }

    const hashInfo = {
      hasPassword: !!user.password,
      length: user.password?.length ?? 0,
      prefix: user.password?.substring(0, 7) ?? null,
      isBcryptHash: user.password?.startsWith("$2") ?? false,
    };

    let verifyResult: boolean | null = null;
    let verifyError: string | null = null;
    if (user.password) {
      try {
        verifyResult = await bcrypt.compare(ADMIN_PASSWORD, user.password);
      } catch (e) {
        verifyError = e instanceof Error ? e.message : String(e);
      }
    }

    const allAdmins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true, email: true, name: true, password: true },
    });
    const adminsWithHashInfo = await Promise.all(
      allAdmins.map(async (u) => {
        const fullUser = await prisma.user.findUnique({ where: { id: u.id } });
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordLength: fullUser?.password?.length ?? 0,
          isBcryptHash: fullUser?.password?.startsWith("$2") ?? false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      email: ADMIN_EMAIL,
      expectedPassword: ADMIN_PASSWORD,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: hashInfo.hasPassword,
        hashLength: hashInfo.length,
        hashPrefix: hashInfo.prefix,
        isBcryptHash: hashInfo.isBcryptHash,
        verifyResult,
        verifyError,
      },
      allAdmins: adminsWithHashInfo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطأ" },
      { status: 500 }
    );
  }
}