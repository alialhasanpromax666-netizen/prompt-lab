import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, errorResponse, getAuthUser } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("غير مصرح", 401);

    const saved = await prisma.savedPrompt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        prompt: {
          include: {
            category: true,
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });

    return apiResponse(saved);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "فشل جلب المحفوظات", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("غير مصرح", 401);

    const body = await request.json();
    const { promptId, title, content, tips, categoryId, level } = body as {
      promptId?: string;
      title?: string;
      content?: string;
      tips?: string[];
      categoryId?: string;
      level?: string;
    };

    if (!promptId) return errorResponse("معرف البرومت مطلوب", 400);

    let realPromptId = promptId;
    const existingPrompt = await prisma.prompt.findUnique({ where: { id: promptId } });
    if (!existingPrompt) {
      if (!title || !content || !categoryId) {
        return errorResponse("البرومت غير موجود وبياناته ناقصة", 400);
      }
      const created = await prisma.prompt.create({
        data: {
          id: promptId,
          title,
          content,
          tips: JSON.stringify(tips ?? []),
          categoryId,
          level: level ?? "intermediate",
          isPublic: false,
          authorId: user.id,
        },
      });
      realPromptId = created.id;
    }

    const existing = await prisma.savedPrompt.findUnique({
      where: { userId_promptId: { userId: user.id, promptId: realPromptId } },
    });
    if (existing) return errorResponse("البرومت محفوظ مسبقاً", 409);

    const saved = await prisma.savedPrompt.create({
      data: { userId: user.id, promptId: realPromptId },
    });

    return apiResponse(saved, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "فشل حفظ البرومت", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("غير مصرح", 401);

    const { promptId } = await request.json();
    if (!promptId) return errorResponse("معرف البرومت مطلوب", 400);

    await prisma.savedPrompt.delete({
      where: { userId_promptId: { userId: user.id, promptId } },
    });

    return apiResponse({ message: "تمت إزالة الحفظ" });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "فشل إزالة الحفظ", 500);
  }
}
