# Seed the 7 mandate-spec qualification tasks (§5).
# Game-track missions carry points; concierge-targeted records
# (gallery_roster, book_onboarding_call) are 0-point, admin-tracked only —
# concierge users never see missions.
from django.db import migrations

TASKS = [
    {
        "key": "provenance_quiz",
        "title_en": "Provenance basics quiz",
        "title_ar": "اختبار أساسيات المصداقية",
        "description_en": "Show you can read a certificate of authenticity and a chain of custody.",
        "description_ar": "أثبت قدرتك على قراءة شهادة الأصالة وسلسلة الحيازة.",
        "points": 30,
        "verification": "instant",
        "roles": [],
        "sort_order": 1,
    },
    {
        "key": "escrow_flow_puzzle",
        "title_en": "Escrow flow puzzle",
        "title_ar": "لغز مسار الضمان",
        "description_en": "Walk through how a protected art purchase settles step by step.",
        "description_ar": "تعرّف خطوة بخطوة على كيفية إتمام شراء فني محمي.",
        "points": 30,
        "verification": "instant",
        "roles": [],
        "sort_order": 2,
    },
    {
        "key": "spot_the_fake",
        "title_en": "Spot the fake",
        "title_ar": "اكتشف المزيّف",
        "description_en": "Tell a verified record from a forged one.",
        "description_ar": "ميّز السجل الموثّق من المزوّر.",
        "points": 30,
        "verification": "instant",
        "roles": [],
        "sort_order": 3,
    },
    {
        "key": "authenticity_checklist",
        "title_en": "Authenticity checklist",
        "title_ar": "قائمة التحقق من الأصالة",
        "description_en": "Review the checklist every FANN work must pass before listing.",
        "description_ar": "راجع قائمة التحقق التي يجب أن يجتازها كل عمل قبل الإدراج.",
        "points": 20,
        "verification": "instant",
        "roles": [],
        "sort_order": 4,
    },
    {
        "key": "portfolio_submission",
        "title_en": "Submit your portfolio",
        "title_ar": "أرسل ملفك الفني",
        "description_en": "Share a portfolio link for founding-cohort review.",
        "description_ar": "شارك رابط ملفك الفني لمراجعة مجموعة المؤسسين.",
        "points": 50,
        "verification": "manual",
        "roles": ["Artist", "Curator"],
        "sort_order": 5,
    },
    {
        "key": "gallery_roster",
        "title_en": "Submit your artist roster",
        "title_ar": "أرسل قائمة فنانيك",
        "description_en": "Concierge-tracked: roster submission for gallery verification.",
        "description_ar": "ضمن المسار المخصّص: تقديم قائمة الفنانين للتحقق من المعرض.",
        "points": 0,
        "verification": "manual",
        "roles": ["Gallery"],
        "sort_order": 6,
    },
    {
        "key": "book_onboarding_call",
        "title_en": "Book your onboarding call",
        "title_ar": "احجز مكالمة الإعداد",
        "description_en": "Concierge-tracked: schedule the advisor onboarding call.",
        "description_ar": "ضمن المسار المخصّص: حدّد موعد مكالمة الإعداد مع المستشار.",
        "points": 0,
        "verification": "manual",
        "roles": ["Gallery", "Investor"],
        "sort_order": 7,
    },
]


def seed(apps, schema_editor):
    Task = apps.get_model("qualification", "Task")
    for t in TASKS:
        Task.objects.update_or_create(key=t["key"], defaults=t)


def unseed(apps, schema_editor):
    Task = apps.get_model("qualification", "Task")
    Task.objects.filter(key__in=[t["key"] for t in TASKS]).delete()


class Migration(migrations.Migration):
    dependencies = [("qualification", "0002_task_usertask")]
    operations = [migrations.RunPython(seed, unseed)]
