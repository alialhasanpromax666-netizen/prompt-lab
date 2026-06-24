import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, errorResponse, getAuthUser } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return errorResponse("غير مصرح", 403);

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    const notes = await prisma.adminNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, email: true } } },
      take: targetType && targetId ? undefined : 50,
    });

    return apiResponse(notes);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "فشل جلب الملاحظات", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return errorResponse("غير مصرح", 403);

    const body = await request.json();
    const { content, targetType, targetId } = body as {
      content: string;
      targetType: string;
      targetId: string;
    };

    if (!content || !targetType || !targetId) {
      return errorResponse("content و targetType و targetId مطلوبة", 400);
    }

    const note = await prisma.adminNote.create({
      data: { content, targetType, targetId, authorId: user.id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    return apiResponse(note, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "فشل إنشاء الملاحظة", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return errorResponse("غير مصرح", 403);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("معرف الملاحظة مطلوب", 400);

    await prisma.adminNote.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "فشل حذف الملاحظة", 500);
  }
}
