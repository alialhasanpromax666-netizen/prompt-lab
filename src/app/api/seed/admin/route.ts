import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@promptlab.com";
const ADMIN_PASSWORD = "Admin@123456";
const SEED_SECRET = process.env.SEED_SECRET ?? "prompt-lab-seed-2026";

async function ensureAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existing) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        password: hashedPassword,
        role: "admin",
        name: existing.name ?? "مدير النظام",
      },
    });
    return { message: "تم تحديث كلمة مرور الأدمن بنجاح", created: false };
  }

  await prisma.user.create({
    data: {
      name: "مدير النظام",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    },
  });
  return { message: "تم إنشاء حساب الأدمن بنجاح", created: true };
}

function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}

export async function POST(request: Request) {
  const auth = request.headers.get("x-seed-secret") ?? "";
  if (auth !== SEED_SECRET) return unauthorized();
  try {
    const result = await ensureAdmin();
    return NextResponse.json({
      success: true,
      ...result,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل إنشاء الأدمن" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("x-seed-secret") ?? "";
  if (auth !== SEED_SECRET) return unauthorized();
  try {
    const result = await ensureAdmin();
    return NextResponse.json({
      success: true,
      ...result,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل إنشاء الأدمن" },
      { status: 500 }
    );
  }
}