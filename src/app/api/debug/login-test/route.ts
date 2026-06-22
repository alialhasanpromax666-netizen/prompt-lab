import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SEED_SECRET = process.env.SEED_SECRET ?? "prompt-lab-seed-2026";

function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}

export async function POST(request: Request) {
  const auth = request.headers.get("x-seed-secret") ?? "";
  if (auth !== SEED_SECRET) return unauthorized();

  try {
    const body = await request.json();
    const email = (body.email as string)?.trim();
    const password = body.password as string;

    if (!email || !password) {
      return NextResponse.json({ error: "البريد وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({
        success: false,
        step: "findUnique",
        message: "المستخدم غير موجود",
        emailSearched: email,
      });
    }

    if (!user.password) {
      return NextResponse.json({
        success: false,
        step: "checkPassword",
        message: "المستخدم بدون كلمة مرور",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    return NextResponse.json({
      success: isValid,
      step: "bcrypt.compare",
      isValid,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      debug: {
        passwordLength: password.length,
        passwordHasArabic: /[\u0600-\u06FF]/.test(password),
        passwordBytes: Buffer.from(password).toString("hex").substring(0, 40),
        hashLength: user.password.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطأ" },
      { status: 500 }
    );
  }
}