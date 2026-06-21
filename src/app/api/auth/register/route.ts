import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z
  .object({
    name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
    email: z.string().email("البريد الإلكتروني غير صحيح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "خطأ في التحقق من البيانات", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    try {
      await prisma.eventLog.create({
        data: {
          type: "register",
          message: `تسجيل مستخدم جديد: ${name ?? email}`,
          userId: user.id,
          metadata: JSON.stringify({ name, email }),
        },
      });
    } catch {
      // non-critical; registration still succeeds
    }

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : "حدث خطأ أثناء التسجيل";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
