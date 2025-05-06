import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from games.models import DailyWord

# List of 5-letter words to use
WORD_LIST = [
    "apple", "beach", "chair", "dance", "eagle", "flame", 
    "ghost", "house", "ivory", "joker", "knife", "lemon", 
    "music", "night", "ocean", "piano", "quest", "radio", 
    "space", "tiger", "unity", "voice", "water", "xenon", 
    "yacht", "zebra", "alive", "bloom", "cloud", "dream",
    "earth", "frost", "glass", "heart", "image", "judge", 
    "kites", "light", "mango", "novel", "oasis", "prize", 
    "quick", "river", "storm", "table", "urban", "video", 
    "world", "youth", "zesty", "alert", "brave", "crest",
    "frost", "grasp", "happy", "ideal", "jumbo", "knack", 
    "loser", "magic", "noble", "olive", "power", "quake", 
    "royal", "style", "tiger", "ultra", "venom", "white", 
    "yield", "zilch", "amaze", "break", "crane", "dried",
    "elate", "force", "green", "haunt", "ivory", "jolly", 
    "keeps", "latch", "mirth", "noble", "onset", "peach", 
    "quiet", "relay", "sting", "trope", "usher", "vivid", 
    "wreck", "xenia", "young", "zoned"
]

class Command(BaseCommand):
    help = 'Sets the word of the day for Wordle'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--word',
            type=str,
            help='Specify a 5-letter word to use (instead of random)',
        )
        
        parser.add_argument(
            '--date',
            type=str,
            help='Specify a date in YYYY-MM-DD format (defaults to today)',
        )
        
    def handle(self, *args, **options):
        # Determine the date to set the word for
        if options['date']:
            try:
                target_date = timezone.datetime.strptime(options['date'], '%Y-%m-%d').date()
            except ValueError:
                self.stderr.write(self.style.ERROR('Invalid date format. Use YYYY-MM-DD.'))
                return
        else:
            target_date = timezone.now().date()
        
        # Check if a word already exists for this date
        existing_word = DailyWord.objects.filter(date=target_date).first()
        if existing_word:
            self.stdout.write(
                self.style.WARNING(f'A word already exists for {target_date}: {existing_word.word}')
            )
            return
        
        # Determine the word to set
        if options['word']:
            word = options['word'].lower()
            if len(word) != 5 or not word.isalpha():
                self.stderr.write(self.style.ERROR('Word must be exactly 5 letters and contain only alphabets.'))
                return
        else:
            word = random.choice(WORD_LIST)
        
        # Create the DailyWord object
        daily_word = DailyWord.objects.create(
            word=word,
            date=target_date
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully set word for {target_date}: {word}')
        ) 