import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from games.models import ConnectionsSet, ConnectionsGroup, ConnectionsWord

class Command(BaseCommand):
    help = 'Create a new connections set for a specific date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=lambda s: date.fromisoformat(s),
            help='Date for the connections set (YYYY-MM-DD)',
            default=date.today()
        )

    def handle(self, *args, **options):
        target_date = options['date']
        
        # Check if a connections set already exists for this date
        if ConnectionsSet.objects.filter(date=target_date).exists():
            self.stdout.write(self.style.WARNING(f'A connections set already exists for {target_date}. Aborting.'))
            return
        
        # Create the connections set
        connections_set = ConnectionsSet.objects.create(date=target_date)
        
        # Create domain-specific groups and words
        self.create_computer_science_groups(connections_set)
        self.create_electrical_electronics_groups(connections_set)
        self.create_mechanical_groups(connections_set)
        self.create_aeronautical_groups(connections_set)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created connections set for {target_date}'))

    def create_computer_science_groups(self, connections_set):
        # Group 1: Programming Paradigms
        group1 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Programming Paradigms',
            description='Different approaches to programming',
            difficulty='medium',
            color='bg-green-300',
            domain='computer_science',
            hint='Different ways to think about programming'
        )
        
        words1 = [
            'Declarative',
            'Imperative',
            'Functional',
            'Object-Oriented'
        ]
        
        for word in words1:
            ConnectionsWord.objects.create(group=group1, word=word)
        
        # Group 2: Esoteric Programming Languages
        group2 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Esoteric Programming Languages',
            description='Unusual programming languages created as a joke or intellectual exercise',
            difficulty='hard',
            color='bg-blue-300',
            domain='computer_science',
            hint='Unconventional languages designed to be weird or funny'
        )
        
        words2 = [
            'Shakespeare',
            'Whitespace',
            'Malbolge',
            'INTERCAL'
        ]
        
        for word in words2:
            ConnectionsWord.objects.create(group=group2, word=word)
        
        # Group 3: Software Design Patterns
        group3 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Software Design Patterns',
            description='Reusable solutions to common problems in software design',
            difficulty='very_hard',
            color='bg-purple-300',
            domain='computer_science',
            hint='Templates for solving recurring design problems'
        )
        
        words3 = [
            'Singleton',
            'Observer',
            'Decorator',
            'Factory'
        ]
        
        for word in words3:
            ConnectionsWord.objects.create(group=group3, word=word)
        
        # Group 4: Database Terminology
        group4 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Database Concepts',
            description='Terms related to database management and design',
            difficulty='easy',
            color='bg-yellow-300',
            domain='computer_science',
            hint='Concepts related to data storage and management'
        )
        
        words4 = [
            'Normalization',
            'Atomicity',
            'Schema',
            'Indexing'
        ]
        
        for word in words4:
            ConnectionsWord.objects.create(group=group4, word=word)

    def create_electrical_electronics_groups(self, connections_set):
        # Group 1: Circuit Components
        group1 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Passive Circuit Components',
            description='Elements in a circuit that don\'t generate power',
            difficulty='easy',
            color='bg-yellow-300',
            domain='electrical_electronics',
            hint='Basic elements that don\'t amplify or process signals'
        )
        
        words1 = [
            'Varistor',
            'Thermistor',
            'Inductor',
            'Capacitor'
        ]
        
        for word in words1:
            ConnectionsWord.objects.create(group=group1, word=word)
        
        # Group 2: Semiconductor Types
        group2 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Semiconductor Devices',
            description='Electronic components that exploit semiconductor properties',
            difficulty='medium',
            color='bg-green-300',
            domain='electrical_electronics',
            hint='Devices that control current flow using semiconductor materials'
        )
        
        words2 = [
            'MOSFET',
            'Thyristor',
            'Diac',
            'Varactor'
        ]
        
        for word in words2:
            ConnectionsWord.objects.create(group=group2, word=word)
        
        # Group 3: Oscillator Types
        group3 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Oscillator Types',
            description='Circuits that generate periodic signals',
            difficulty='hard',
            color='bg-blue-300',
            domain='electrical_electronics',
            hint='Circuits that create repetitive waveforms'
        )
        
        words3 = [
            'Colpitts',
            'Hartley',
            'Pierce',
            'Clapp'
        ]
        
        for word in words3:
            ConnectionsWord.objects.create(group=group3, word=word)
        
        # Group 4: Communication Protocols
        group4 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Communication Protocols',
            description='Standards for data exchange between electronic devices',
            difficulty='very_hard',
            color='bg-purple-300',
            domain='electrical_electronics',
            hint='Rules for how data is transmitted between devices'
        )
        
        words4 = [
            'I²C',
            'SPI',
            'UART',
            'CAN'
        ]
        
        for word in words4:
            ConnectionsWord.objects.create(group=group4, word=word)

    def create_mechanical_groups(self, connections_set):
        # Group 1: Turbines
        group1 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Turbine Types',
            description='Rotating mechanical devices that extract energy',
            difficulty='medium',
            color='bg-green-300',
            domain='mechanical',
            hint='Machines that convert fluid flow to rotational energy'
        )
        
        words1 = [
            'Kaplan',
            'Pelton',
            'Francis',
            'Bulb'
        ]
        
        for word in words1:
            ConnectionsWord.objects.create(group=group1, word=word)
        
        # Group 2: Material Testing
        group2 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Material Testing Methods',
            description='Techniques to evaluate material properties',
            difficulty='hard',
            color='bg-blue-300',
            domain='mechanical',
            hint='Ways to determine how materials behave under different conditions'
        )
        
        words2 = [
            'Charpy',
            'Rockwell',
            'Brinell',
            'Izod'
        ]
        
        for word in words2:
            ConnectionsWord.objects.create(group=group2, word=word)
        
        # Group 3: Bearings
        group3 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Bearing Types',
            description='Machine elements that constrain relative motion',
            difficulty='easy',
            color='bg-yellow-300',
            domain='mechanical',
            hint='Components that reduce friction between moving parts'
        )
        
        words3 = [
            'Tapered',
            'Needle',
            'Thrust',
            'Journal'
        ]
        
        for word in words3:
            ConnectionsWord.objects.create(group=group3, word=word)
        
        # Group 4: Thermodynamic Cycles
        group4 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Thermodynamic Cycles',
            description='Processes that convert heat to work and back',
            difficulty='very_hard',
            color='bg-purple-300',
            domain='mechanical',
            hint='Sequences of states that a system goes through to produce work'
        )
        
        words4 = [
            'Rankine',
            'Brayton',
            'Carnot',
            'Otto'
        ]
        
        for word in words4:
            ConnectionsWord.objects.create(group=group4, word=word)

    def create_aeronautical_groups(self, connections_set):
        # Group 1: Aircraft Control Surfaces
        group1 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Aircraft Control Surfaces',
            description='Movable parts that control aircraft attitude',
            difficulty='easy',
            color='bg-yellow-300',
            domain='aeronautical',
            hint='Parts that move to change how an aircraft flies'
        )
        
        words1 = [
            'Aileron',
            'Elevator',
            'Rudder',
            'Flap'
        ]
        
        for word in words1:
            ConnectionsWord.objects.create(group=group1, word=word)
        
        # Group 2: Jet Engine Components
        group2 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Jet Engine Components',
            description='Critical parts in jet propulsion systems',
            difficulty='medium',
            color='bg-green-300',
            domain='aeronautical',
            hint='Parts that make a jet engine work'
        )
        
        words2 = [
            'Compressor',
            'Turbine',
            'Combustor',
            'Diffuser'
        ]
        
        for word in words2:
            ConnectionsWord.objects.create(group=group2, word=word)
        
        # Group 3: Airfoil Designs
        group3 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Airfoil Designs',
            description='Various wing cross-sectional shapes',
            difficulty='hard',
            color='bg-blue-300',
            domain='aeronautical',
            hint='Different shapes of wings in cross-section'
        )
        
        words3 = [
            'NACA',
            'Supercritical',
            'Laminar',
            'Reflexed'
        ]
        
        for word in words3:
            ConnectionsWord.objects.create(group=group3, word=word)
        
        # Group 4: Aerodynamic Phenomena
        group4 = ConnectionsGroup.objects.create(
            connections_set=connections_set,
            name='Aerodynamic Phenomena',
            description='Physical effects related to air movement',
            difficulty='very_hard',
            color='bg-purple-300',
            domain='aeronautical',
            hint='What happens when air moves in certain ways'
        )
        
        words4 = [
            'Vortex',
            'Stall',
            'Buffeting',
            'Flutter'
        ]
        
        for word in words4:
            ConnectionsWord.objects.create(group=group4, word=word) 