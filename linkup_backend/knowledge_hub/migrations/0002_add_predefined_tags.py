from django.db import migrations
from django.utils.text import slugify

def add_predefined_tags(apps, schema_editor):
    Tag = apps.get_model('knowledge_hub', 'Tag')
    predefined_tags = [
        'Interview Tips',
        'Tech Stack',
        'Case Study',
        'Career Growth',
        'Industry Insights',
        'Best Practices',
        'Tutorial',
        'Research',
        'Innovation',
        'Leadership',
        'Project Management',
        'Software Development',
        'Data Science',
        'Machine Learning',
        'Web Development',
        'Mobile Development',
        'Cloud Computing',
        'Cybersecurity',
        'DevOps',
        'UI/UX Design'
    ]
    
    for tag_name in predefined_tags:
        Tag.objects.get_or_create(
            name=tag_name,
            slug=slugify(tag_name),
            defaults={'is_predefined': True}
        )

def remove_predefined_tags(apps, schema_editor):
    Tag = apps.get_model('knowledge_hub', 'Tag')
    Tag.objects.filter(is_predefined=True).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('knowledge_hub', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_predefined_tags, remove_predefined_tags),
    ] 