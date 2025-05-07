from django.db import migrations

def update_vote_counts(apps, schema_editor):
    """
    Update all existing Question and Answer records to have accurate downvote counts
    based on their corresponding vote records.
    """
    Question = apps.get_model('knowledge_hub', 'Question')
    Answer = apps.get_model('knowledge_hub', 'Answer')
    QuestionVote = apps.get_model('knowledge_hub', 'QuestionVote')
    AnswerVote = apps.get_model('knowledge_hub', 'AnswerVote')
    
    # Update Question downvote counts
    for question in Question.objects.all():
        downvote_count = QuestionVote.objects.filter(question=question, value=-1).count()
        question.downvote_count = downvote_count
        question.save()
    
    # Update Answer downvote counts
    for answer in Answer.objects.all():
        downvote_count = AnswerVote.objects.filter(answer=answer, value=-1).count()
        answer.downvote_count = downvote_count
        answer.save()


class Migration(migrations.Migration):

    dependencies = [
        ('knowledge_hub', '0004_answer_downvote_count_question_downvote_count'),
    ]

    operations = [
        migrations.RunPython(update_vote_counts),
    ] 