import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, errorResponse, getAuthUser } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse("غير مصرح", 401);
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12")));
    const sort = searchParams.get("sort") ?? "latest";

    const orderBy: Record<string, unknown> =
      sort === "popular" ? { likes: { _count: "desc" } } : { createdAt: "desc" };

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where: { isPublic: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          category: true,
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true, savedBy: true, comments: true } },
        },
      }),
      prisma.prompt.count({ where: { isPublic: true } }),
    ]);

    return apiResponse({
      prompts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "فشل جلب برومتات المجتمع", 500);
  }
}
