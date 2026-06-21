import { prisma } from "../src/lib/prisma";

async function main() {
  const categories = [
    { id: "marketing", name: "التسويق والإعلان", description: "برومتات لحملات تسويقية، إعلانات، وإيميلات ترويجية", color: "#22c55e", icon: "Target", sortOrder: 1 },
    { id: "programming", name: "البرمجة والتطوير", description: "برومتات لكتابة الأكواد، تصحيح الأخطاء، ومراجعة الكود", color: "#3b82f6", icon: "Code", sortOrder: 2 },
    { id: "education", name: "التعليم والتدريب", description: "برومتات لتصميم الخطط الدراسية والاختبارات", color: "#a855f7", icon: "GraduationCap", sortOrder: 3 },
    { id: "design", name: "التصميم الجرافيكي", description: "برومتات لتصميم الشعارات والواجهات والبوسترات", color: "#f59e0b", icon: "Palette", sortOrder: 4 },
    { id: "creative", name: "الكتابة الإبداعية", description: "برومتات لكتابة القصص والروايات والنصوص الأدبية", color: "#ec4899", icon: "PenNib", sortOrder: 5 },
    { id: "business", name: "الأعمال وريادة الأعمال", description: "برومتات لخطط العمل والاستراتيجيات", color: "#14b8a6", icon: "Briefcase", sortOrder: 6 },
    { id: "social", name: "السوشيال ميديا", description: "برومتات لمحتوى التواصل الاجتماعي والهاشتاقات", color: "#f97316", icon: "DeviceMobileCamera", sortOrder: 7 },
    { id: "data", name: "تحليل البيانات", description: "برومتات لإعداد التقارير ولوحات البيانات", color: "#06b6d4", icon: "ChartBar", sortOrder: 8 },
    { id: "content", name: "المحتوى التعليمي", description: "برومتات لإنتاج فيديوهات ودورات تعليمية", color: "#e11d48", icon: "Video", sortOrder: 9 },
    { id: "photography", name: "التصوير والفيديو", description: "برومتات لتحرير الصور وتصوير الفيديو", color: "#8b5cf6", icon: "Camera", sortOrder: 10 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }

  const prompts = [
    { id: "mkt-001", categoryId: "marketing", title: "إعلان منتج جديد", content: "اكتب إعلاناً مقنعاً لمنتج {product} يستهدف {audience}. ركز على المشكلة التي يحلها المنتج، واستخدم لغة عاطفية مقنعة. أضف عبارة تحث على اتخاذ إجراء (CTA) في النهاية. استخدم نبرة {tone}.", level: "intermediate", tags: '["إعلانات", "منتجات", "تسويق"]', usageCount: 152, isPublic: true },
    { id: "mkt-002", categoryId: "marketing", title: "إيميل تسويقي", content: "اكتب إيميلاً تسويقياً احترافياً للترويج لـ {offer}. ابدأ بعنوان جذاب، ثم قدم قيمة العرض، وأضف دليلاً اجتماعياً (شهادات عملاء)، واختتم بعبارة CTA واضحة.", level: "beginner", tags: '["إيميلات", "تسويق"]', usageCount: 98, isPublic: true },
    { id: "mkt-003", categoryId: "marketing", title: "خطة تسويق متكاملة", content: "قم بإنشاء خطة تسويقية شاملة لـ {business} في قطاع {industry}. يجب أن تتضمن: تحليل SWOT، استراتيجية المحتوى، قنوات التوزيع، الميزانية المقترحة، مؤشرات الأداء (KPIs)، والجدول الزمني للتنفيذ.", level: "advanced", tags: '["خطط تسويقية", "استراتيجية"]', usageCount: 67, isPublic: true },
    { id: "prog-001", categoryId: "programming", title: "كتابة دالة برمجية", content: "اكتب دالة بلغة {language} تقوم بـ {task}. يجب أن تكون الدالة: نقية، مع تعليقات توضيحية، معالجة للأخطاء، وتتبع أفضل الممارسات. أضف مثالاً على استخدامها.", level: "intermediate", tags: '["برمجة", "أكواد"]', usageCount: 234, isPublic: true },
    { id: "prog-002", categoryId: "programming", title: "مراجعة كود", content: "قم بمراجعة الكود التالي بلغة {language}. حدد: المشاكل الأمنية، ثغرات الأداء، انتهاكات مبادئ SOLID، فرص إعادة الهيكلة. اقترح تحسينات محددة مع أمثلة كود.", level: "advanced", tags: '["مراجعة كود", "تحسين"]', usageCount: 87, isPublic: true },
    { id: "prog-003", categoryId: "programming", title: "شرح مفهوم برمجي", content: "اشرح مفهوم {concept} في {language} لمبرمج مبتدئ. استخدم تشبيهاً من الحياة الواقعية، ثم قدم مثالاً برمجياً بسيطاً، ثم مثالاً متقدماً.", level: "beginner", tags: '["تعليم برمجة", "مفاهيم"]', usageCount: 156, isPublic: true },
    { id: "edu-001", categoryId: "education", title: "خطة درس تفاعلية", content: "صمم خطة درس تفاعلية لمادة {subject} حول موضوع {topic}. مدة الدرس {duration} دقيقة. استخدم نموذج التعلم النشط: تمهيد، شرح، نشاط تطبيقي، تقييم.", level: "intermediate", tags: '["خطط دراسية", "تدريس"]', usageCount: 73, isPublic: true },
    { id: "dsgn-001", categoryId: "design", title: "تصميم شعار", content: "صمم شعاراً لعلامة تجارية {brand} في مجال {industry}. قدم ثلاث مفاهيم مختلفة مع شرح الفكرة وراء كل مفهوم. حدد الألوان المقترحة ونوع الخط المناسب.", level: "advanced", tags: '["شعارات", "هوية بصرية"]', usageCount: 112, isPublic: true },
    { id: "crea-001", categoryId: "creative", title: "قصة قصيرة", content: "اكتب قصة قصيرة عن {theme} تحتوي على {words} كلمة. استخدم تقنية {technique}. يجب أن تحتوي القصة على: شخصية رئيسية، صراع، ذروة، وحل.", level: "advanced", tags: '["قصص", "أدب"]', usageCount: 91, isPublic: true },
    { id: "bus-001", categoryId: "business", title: "نموذج عمل تجاري", content: "قم بإنشاء نموذج عمل تجاري لشركة ناشئة في مجال {industry}. غطِ العناصر التالية: عرض القيمة، الشرائح المستهدفة، قنوات التوزيع، مصادر الإيرادات.", level: "advanced", tags: '["شركات ناشئة", "نموذج عمل"]', usageCount: 56, isPublic: true },
    { id: "soc-001", categoryId: "social", title: "منشور تفاعلي", content: "اكتب منشوراً تفاعلياً لـ {platform} يستهدف {audience}. استخدم صيغة AIDA: جذب الانتباه، إثارة الاهتمام، خلق الرغبة، دعوة للتفاعل.", level: "beginner", tags: '["منشورات", "تفاعل"]', usageCount: 167, isPublic: true },
    { id: "data-001", categoryId: "data", title: "تحليل بيانات تقرير", content: "قم بتحليل مجموعة البيانات. استخرج: الاتجاهات الرئيسية، القيم الشاذة، الارتباطات بين المتغيرات. قدم توصيات قابلة للتنفيذ.", level: "advanced", tags: '["تحليل", "تقارير"]', usageCount: 43, isPublic: true },
    { id: "cont-001", categoryId: "content", title: "سكريبت فيديو تعليمي", content: "اكتب سكريبت فيديو تعليمي عن {topic} مدته {duration} دقيقة. قسم السكريبت إلى: مقدمة مشوقة، المحتوى الرئيسي، خاتمة مع دعوة للاشتراك.", level: "intermediate", tags: '["فيديو", "سكريبت"]', usageCount: 89, isPublic: true },
    { id: "photo-001", categoryId: "photography", title: "وصف مشهد تصويري", content: "صِف المشهد التصويري المطلوب لـ {type}. يجب أن يشمل: الإضاءة، الزاوية، الخلفية، العدسة المقترحة، البعد البؤري.", level: "intermediate", tags: '["تصوير", "إضاءة"]', usageCount: 36, isPublic: true },
  ];

  for (const p of prompts) {
    await prisma.prompt.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  await prisma.$executeRawUnsafe(`
    UPDATE "Category" SET "promptCount" = (
      SELECT COUNT(*) FROM "Prompt" WHERE "Prompt"."categoryId" = "Category"."id"
    )
  `);

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
