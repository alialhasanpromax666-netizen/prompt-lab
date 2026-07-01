import { NextRequest } from "next/server";
import { z } from "zod";
import { apiResponse, errorResponse, getAuthUser } from "@/lib/api-helpers";
import { generateWithTokenRouter } from "@/lib/tokenrouter";

const generateSchema = z.object({
  goal: z.string().min(1).max(500),
  categoryId: z.string().min(1),
  categoryName: z.string().default(""),
  categoryCustom: z.string().default(""),
  keywords: z.string().default(""),
});

const SYSTEM_PROMPT = `أنت خبير في تصميم مهارات (Skills) لوكلاء AI باللغة العربية.
مهمتك: توليد مهارة احترافية بناءً على طلب المستخدم.

المهارة = مجموعة تعليمات نظام + متغيرات + مثال استخدام.

يجب أن يكون الرد بصيغة JSON بالضبط:
{
  "title": "عنوان المهارة (مختصر وجذاب)",
  "description": "وصف المهارة في سطر واحد (ماكس 100 حرف)",
  "systemPrompt": "نص التعليمات الكامل للوكيل (بين 200-600 حرف، منظم، يبدأ بـ 'أنت وكيل متخصص في...')",
  "variables": ["اسم_المتغير_1", "اسم_المتغير_2"],
  "exampleInput": "مثال لاستخدام المهارة مع قيم المتغيرات"
}

القواعد:
- المحتوى بالعربية الفصحى
- اجعل systemPrompt جاهز للنسخ والاستخدام الفوري
- المتغيرات: 2-4 متغيرات بين أقواس {} مثل {المنتج} {الجمهور}
- exampleInput: جملة توضيحية لاستخدام المهارة`;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("غير مصرح", 401);

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? "بيانات غير صالحة", 400);

    const customCategorySection = parsed.data.categoryCustom ? `\nالتصنيف المخصص: ${parsed.data.categoryCustom}` : "";
    const userPrompt = `المجال: ${parsed.data.categoryName}${customCategorySection}
الهدف: ${parsed.data.goal}
الكلمات المفتاحية: ${parsed.data.keywords || "عام"}

المطلوب: صمم مهارة لوكيل AI في مجال ${parsed.data.categoryName} لتحقيق "${parsed.data.goal}".`;

    const raw = await generateWithTokenRouter(SYSTEM_PROMPT, userPrompt);
    if (!raw) return errorResponse("فشل التوليد، حاول مرة أخرى", 500);

    const cleaned = raw.replace(/^```json|```$/g, "").trim();
    const json = JSON.parse(cleaned);

    return apiResponse({
      title: json.title ?? "",
      description: json.description ?? "",
      systemPrompt: json.systemPrompt ?? "",
      variables: Array.isArray(json.variables) ? json.variables : [],
      exampleInput: json.exampleInput ?? "",
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "فشل توليد المهارة", 500);
  }
}
