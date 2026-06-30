from django.db import migrations
import json


def convert_goal_type_to_json(apps, schema_editor):
    IntersetReward = apps.get_model("users", "IntersetReward")
    for obj in IntersetReward.objects.all():
        if obj.goal_type:
            # Convert string to JSON array with one element
            try:
                obj.goal_type = json.dumps([obj.goal_type])
            except Exception:
                obj.goal_type = json.dumps([])
            obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0038_user_profile_partial_completed"),
    ]

    operations = [
        migrations.RunPython(convert_goal_type_to_json),
    ]
