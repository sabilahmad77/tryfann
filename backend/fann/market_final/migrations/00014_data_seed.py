from django.db import migrations


def seed_master_data(apps, schema_editor):
    Region = apps.get_model("market_final", "Region")
    InstagramFollowers = apps.get_model("market_final", "InstagramFollowers")
    TikTokFollowers = apps.get_model("market_final", "TikTokFollowers")
    YoutubeSubscribers = apps.get_model("market_final", "YoutubeSubscribers")
    TwitterFollowers = apps.get_model("market_final", "TwitterFollowers")
    Progression = apps.get_model("market_final", "Progression")
    PrimaryPlatform = apps.get_model("market_final", "PrimaryPlatform")
    PriceRange = apps.get_model("market_final", "PriceRange")

    # -------------------------------------------------
    # Helper: safe seed (handles duplicates gracefully)
    # -------------------------------------------------
    def seed_if_not_exists(model, field, values):
        existing = set(model.objects.values_list(field, flat=True))
        for val in values:
            if val not in existing:
                model.objects.create(**{field: val})

    # ---------- Regions ----------
    regions = [
        "UAE",
        "Saudi Arabia",
        "Qatar",
        "Kuwait",
        "Bahrain",
        "Oman",
        "Egypt",
        "Lebanon",
        "Jordan",
        "Other",
    ]
    seed_if_not_exists(Region, "name", regions)

    # ---------- Followers / Subscribers ----------
    ranges = [
        "Under 1k",
        "1k-10k",
        "10k-50k",
        "50k-100k",
        "100k-500k",
        "500k-1M",
        "1M+",
    ]

    seed_if_not_exists(InstagramFollowers, "range", ranges)
    seed_if_not_exists(TikTokFollowers, "range", ranges)
    seed_if_not_exists(YoutubeSubscribers, "range", ranges)
    seed_if_not_exists(TwitterFollowers, "range", ranges)

    # ---------- Progression Levels ----------
    progressions = [
        ("Explorer", "0-500 pts"),
        ("Curator", "501-1500 pts"),
        ("Patron", "1501-3500 pts"),
        ("Ambassador", "3501-7500 pts"),
        ("Founding Patron", "7501+ pts"),
    ]

    existing_progressions = set(Progression.objects.values_list("name", flat=True))

    for name, points in progressions:
        if name not in existing_progressions:
            Progression.objects.create(name=name, points=points)

    # ---------- Primary Platforms ----------
    platforms = ["Instagram", "TikTok", "YouTube", "Twitter/X", "Other"]
    seed_if_not_exists(PrimaryPlatform, "name", platforms)

    # ---------- Price Ranges ----------
    price_ranges = ["<$100", "$100-500", "$500-2K", "$2K-10k", "10K+"]
    seed_if_not_exists(PriceRange, "name", price_ranges)


class Migration(migrations.Migration):

    dependencies = [
        ("market_final", "0013_alter_artworkartistcollection_user_type_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_master_data, migrations.RunPython.noop),
    ]
