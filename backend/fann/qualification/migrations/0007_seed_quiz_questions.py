# QUIZ-1 (audit BRK-03/SEC-01): seed real bilingual question banks for the
# four founding missions so completion requires knowledge, not a click.
# Correct-answer indices live only server-side (stripped by the serializer).
# Also scopes portfolio_submission to Artist only (audit UX-03: artist tasks
# were leaking into the Curator mission list).
from django.db import migrations

QUESTION_BANKS = {
    "provenance_quiz": [
        {
            "q_en": "What does a certificate of authenticity primarily document?",
            "q_ar": "ما الذي توثّقه شهادة الأصالة في المقام الأول؟",
            "options_en": [
                "The artwork's current market price",
                "The work's creator, details and authenticity attestation",
                "The buyer's identity",
                "Shipping insurance terms",
            ],
            "options_ar": [
                "السعر السوقي الحالي للعمل الفني",
                "منشئ العمل وتفاصيله وإثبات أصالته",
                "هوية المشتري",
                "شروط تأمين الشحن",
            ],
            "answer": 1,
        },
        {
            "q_en": "What is a 'chain of custody' in art provenance?",
            "q_ar": "ما المقصود بـ'سلسلة الحيازة' في مصداقية الأعمال الفنية؟",
            "options_en": [
                "A documented record of everyone who has owned or held the work",
                "The gallery's security system",
                "The artist's signature style",
                "A type of frame mounting",
            ],
            "options_ar": [
                "سجل موثّق لكل من امتلك العمل أو حازه",
                "نظام أمان المعرض",
                "أسلوب توقيع الفنان",
                "نوع من تركيب الإطارات",
            ],
            "answer": 0,
        },
        {
            "q_en": "A gap in a work's ownership history should make a careful collector…",
            "q_ar": "وجود فجوة في تاريخ ملكية العمل يجب أن يدفع الجامع الحريص إلى…",
            "options_en": [
                "Ignore it — gaps are normal",
                "Pay more, gaps add mystery",
                "Ask for additional verification before purchase",
                "Assume the work is fake",
            ],
            "options_ar": [
                "تجاهلها — الفجوات أمر طبيعي",
                "دفع المزيد، فالغموض يزيد القيمة",
                "طلب تحقق إضافي قبل الشراء",
                "افتراض أن العمل مزيّف",
            ],
            "answer": 2,
        },
    ],
    "escrow_flow_puzzle": [
        {
            "q_en": "In a protected escrow purchase, when does the seller receive the funds?",
            "q_ar": "في عملية شراء محمية بالضمان، متى يستلم البائع المبلغ؟",
            "options_en": [
                "Immediately when the order is placed",
                "After the buyer confirms receipt and authenticity",
                "Before the artwork ships",
                "Whenever the seller requests it",
            ],
            "options_ar": [
                "فور تقديم الطلب",
                "بعد تأكيد المشتري للاستلام والأصالة",
                "قبل شحن العمل الفني",
                "متى ما طلب البائع ذلك",
            ],
            "answer": 1,
        },
        {
            "q_en": "Who holds the funds during an escrow transaction?",
            "q_ar": "من يحتفظ بالمبلغ أثناء معاملة الضمان؟",
            "options_en": [
                "The seller",
                "The artist's agent",
                "A neutral third party",
                "The buyer's credit card",
            ],
            "options_ar": [
                "البائع",
                "وكيل الفنان",
                "طرف ثالث محايد",
                "بطاقة المشتري الائتمانية",
            ],
            "answer": 2,
        },
        {
            "q_en": "What does escrow primarily protect the buyer from?",
            "q_ar": "ممّ يحمي الضمان المشتري في المقام الأول؟",
            "options_en": [
                "Paying for a work that never arrives or isn't as described",
                "Price changes after purchase",
                "Currency exchange fees",
                "Gallery commissions",
            ],
            "options_ar": [
                "دفع ثمن عمل لا يصل أو لا يطابق الوصف",
                "تغيّر الأسعار بعد الشراء",
                "رسوم صرف العملات",
                "عمولات المعارض",
            ],
            "answer": 0,
        },
    ],
    "spot_the_fake": [
        {
            "q_en": "Which is the strongest sign a provenance record may be forged?",
            "q_ar": "ما أقوى مؤشر على أن سجل المصداقية قد يكون مزوّرًا؟",
            "options_en": [
                "Handwritten receipts from decades ago",
                "Multiple previous owners",
                "An old auction label",
                "Documentation that can't be traced to any verifiable source",
            ],
            "options_ar": [
                "إيصالات مكتوبة بخط اليد من عقود مضت",
                "تعدد المالكين السابقين",
                "ملصق مزاد قديم",
                "وثائق لا يمكن تتبعها إلى أي مصدر يمكن التحقق منه",
            ],
            "answer": 3,
        },
        {
            "q_en": "A verified record differs from a forged one because it is…",
            "q_ar": "يختلف السجل الموثّق عن المزوّر لأنه…",
            "options_en": [
                "Independently checkable against a provenance registry",
                "Printed in color",
                "Signed by the seller",
                "Longer and more detailed",
            ],
            "options_ar": [
                "قابل للتحقق المستقل عبر سجل المصداقية",
                "مطبوع بالألوان",
                "موقّع من البائع",
                "أطول وأكثر تفصيلًا",
            ],
            "answer": 0,
        },
        {
            "q_en": "If a seller refuses independent verification, you should…",
            "q_ar": "إذا رفض البائع التحقق المستقل، فعليك…",
            "options_en": [
                "Buy quickly before someone else does",
                "Treat it as a serious red flag",
                "Offer a lower price",
                "Ask a friend's opinion instead",
            ],
            "options_ar": [
                "الشراء بسرعة قبل أن يسبقك غيرك",
                "اعتباره إشارة تحذير جدية",
                "عرض سعر أقل",
                "الاكتفاء برأي صديق",
            ],
            "answer": 1,
        },
    ],
    "authenticity_checklist": [
        {
            "q_en": "Which item belongs on a pre-listing authenticity checklist?",
            "q_ar": "أي عنصر ينتمي إلى قائمة التحقق من الأصالة قبل الإدراج؟",
            "options_en": [
                "The artist's social media following",
                "The buyer's budget",
                "Physical inspection plus provenance documentation",
                "Framing preferences",
            ],
            "options_ar": [
                "عدد متابعي الفنان على وسائل التواصل",
                "ميزانية المشتري",
                "الفحص المادي مع وثائق المصداقية",
                "تفضيلات التأطير",
            ],
            "answer": 2,
        },
        {
            "q_en": "Why must every work pass the checklist BEFORE listing?",
            "q_ar": "لماذا يجب أن يجتاز كل عمل قائمة التحقق قبل الإدراج؟",
            "options_en": [
                "So buyers can trust every listing is verified physical art",
                "To slow sellers down",
                "For tax purposes",
                "To raise listing prices",
            ],
            "options_ar": [
                "ليثق المشترون بأن كل عمل مدرج هو فن مادي موثّق",
                "لإبطاء البائعين",
                "لأغراض ضريبية",
                "لرفع أسعار الإدراج",
            ],
            "answer": 0,
        },
        {
            "q_en": "What happens to a work that cannot meet the checklist?",
            "q_ar": "ما مصير العمل الذي لا يستوفي قائمة التحقق؟",
            "options_en": [
                "It is listed with a warning",
                "It is listed at a discount",
                "It is sold privately",
                "It is not listed at all",
            ],
            "options_ar": [
                "يُدرج مع تحذير",
                "يُدرج بسعر مخفّض",
                "يُباع بشكل خاص",
                "لا يُدرج على الإطلاق",
            ],
            "answer": 3,
        },
    ],
}


def seed_questions(apps, schema_editor):
    Task = apps.get_model("qualification", "Task")
    for key, bank in QUESTION_BANKS.items():
        Task.objects.filter(key=key).update(questions=bank)
    # UX-03: portfolio submission is an artist deliverable; stop leaking it
    # into the Curator mission list.
    Task.objects.filter(key="portfolio_submission").update(roles=["Artist"])


def unseed_questions(apps, schema_editor):
    Task = apps.get_model("qualification", "Task")
    Task.objects.filter(key__in=QUESTION_BANKS.keys()).update(questions=[])
    Task.objects.filter(key="portfolio_submission").update(
        roles=["Artist", "Curator"]
    )


class Migration(migrations.Migration):
    dependencies = [
        ("qualification", "0006_task_questions_usertask_attempts_and_more"),
    ]
    operations = [migrations.RunPython(seed_questions, unseed_questions)]
