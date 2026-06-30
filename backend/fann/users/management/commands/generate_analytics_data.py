"""
Django Management Command to Generate Test Data for Analytics
Place this file in: fann/artist/management/commands/generate_analytics_data.py
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from fann.users.models import User
from fann.artist.models import (
    Art, Order, ArtViewCount, ArtWishList,
    ArtReviews, ArtComment
)


class Command(BaseCommand):
    help = 'Generate test data for analytics dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--artist-email',
            type=str,
            default='artist@test.com',
            help='Email of the artist user'
        )
        parser.add_argument(
            '--num-arts',
            type=int,
            default=10,
            help='Number of artworks to create'
        )
        parser.add_argument(
            '--num-buyers',
            type=int,
            default=20,
            help='Number of buyer users to create'
        )

    def handle(self, *args, **options):
        artist_email = options['artist_email']
        num_arts = options['num_arts']
        num_buyers = options['num_buyers']

        self.stdout.write(self.style.SUCCESS('Starting test data generation...'))

        # Get or create artist
        artist = self._get_or_create_artist(artist_email)
        self.stdout.write(self.style.SUCCESS(f'Using artist: {artist.email}'))

        # Create buyers
        buyers = self._create_buyers(num_buyers)
        self.stdout.write(self.style.SUCCESS(f'Created {len(buyers)} buyers'))

        # Create artworks
        arts = self._create_artworks(artist, num_arts)
        self.stdout.write(self.style.SUCCESS(f'Created {len(arts)} artworks'))

        # Create views data
        self._create_view_data(arts)
        self.stdout.write(self.style.SUCCESS('Created view data'))

        # Create wishlist data
        self._create_wishlist_data(arts, buyers)
        self.stdout.write(self.style.SUCCESS('Created wishlist data'))

        # Create orders
        self._create_orders(artist, arts, buyers)
        self.stdout.write(self.style.SUCCESS('Created orders'))

        # Create reviews
        self._create_reviews(arts, buyers)
        self.stdout.write(self.style.SUCCESS('Created reviews'))

        # Create comments
        self._create_comments(arts, buyers)
        self.stdout.write(self.style.SUCCESS('Created comments'))

        self.stdout.write(self.style.SUCCESS('\n=== Test Data Generation Complete ==='))
        self.stdout.write(self.style.SUCCESS(f'Artist Email: {artist.email}'))
        self.stdout.write(self.style.SUCCESS(f'Artworks Created: {len(arts)}'))
        self.stdout.write(self.style.SUCCESS(f'Buyers Created: {len(buyers)}'))

    def _get_or_create_artist(self, email):
        """Get or create artist user"""
        artist = User.objects.filter(email=email).first()
        if not artist:
            artist = User.objects.create_user(
                email=email,
                password='testpass123',
                first_name='Test',
                last_name='Artist',
                role='Artist',
                is_verify=True
            )
        return artist

    def _create_buyers(self, num_buyers):
        """Create buyer users"""
        buyers = []
        locations = [
            'United States', 'Germany', 'Japan', 'Canada',
            'United Kingdom', 'France', 'Australia', 'Spain',
            'Italy', 'Netherlands'
        ]

        for i in range(num_buyers):
            buyer = User.objects.create_user(
                email=f'buyer{i}@test.com',
                password='testpass123',
                first_name=f'Buyer{i}',
                last_name=f'Test{i}',
                role='Customer',
                location=random.choice(locations),
                is_verify=True
            )
            buyers.append(buyer)

        return buyers

    def _create_artworks(self, artist, num_arts):
        """Create artworks"""
        arts = []
        categories = ['Abstract', 'Landscape', 'Portrait', 'Digital', 'Sculpture']
        mediums = ['Oil', 'Acrylic', 'Watercolor', 'Digital', 'Mixed Media']
        color_palettes = ['Warm', 'Cool', 'Neutral', 'Earthy', 'Oceanic']

        for i in range(num_arts):
            art = Art.objects.create(
                artist=artist,
                title=f'Digital Dreams #{127 + i}',
                description=f'A beautiful piece of art number {i}',
                category=random.choice(categories),
                medium=random.choice(mediums),
                price=random.randint(200, 2000),
                discount_price=random.randint(150, 1800),
                year=random.randint(2020, 2024),
                royalty=random.randint(5, 15),
                color_palette=random.choice(color_palettes),
                copy_or_original='Original',
                print_or_real='Real',
                mood_atmosphere=random.choice(['Calming', 'Energetic', 'Joyful']),
                art_type='Single',
                is_sold=random.choice([True, False])
            )
            arts.append(art)

        return arts

    def _create_view_data(self, arts):
        """Create view count data for the past 6 months"""
        now = timezone.now()

        for art in arts:
            # Create views for each month
            for month_offset in range(6):
                month_date = now - timedelta(days=30 * month_offset)

                # Create multiple view records per month
                for week in range(4):
                    view_date = month_date - timedelta(days=7 * week)
                    view_count = random.randint(50, 500)

                    ArtViewCount.objects.create(
                        art=art,
                        count=view_count,
                        created_at=view_date
                    )

    def _create_wishlist_data(self, arts, buyers):
        """Create wishlist entries"""
        now = timezone.now()

        for art in arts:
            # Random number of users add to wishlist
            num_likes = random.randint(5, 30)
            selected_buyers = random.sample(buyers, min(num_likes, len(buyers)))

            for buyer in selected_buyers:
                # Random date in past 6 months
                days_ago = random.randint(1, 180)
                created_date = now - timedelta(days=days_ago)

                ArtWishList.objects.create(
                    art=art,
                    user=buyer,
                    created_at=created_date
                )

    def _create_orders(self, artist, arts, buyers):
        """Create orders for the past 6 months"""
        now = timezone.now()
        statuses = ['Pending', 'Shipped', 'In Transit', 'Delivered', 'Completed']

        for art in arts:
            # Create 1-5 orders per art
            num_orders = random.randint(1, 5)

            for _ in range(num_orders):
                buyer = random.choice(buyers)
                days_ago = random.randint(1, 180)
                created_date = now - timedelta(days=days_ago)

                # Calculate prices
                subtotal = Decimal(str(art.price))
                shipping = Decimal(str(random.randint(10, 50)))
                tax = subtotal * Decimal('0.10')
                platform_fee = subtotal * Decimal('0.05')
                total = subtotal + shipping + tax - platform_fee

                # Create order
                order = Order.objects.create(
                    buyer=buyer,
                    art=art,
                    artist=artist,
                    status=random.choice(statuses),
                    currency='Fiat',
                    subtotal=subtotal,
                    shipping_cost=shipping,
                    tax_amount=tax,
                    platform_fee=platform_fee,
                    total=total,
                    payment_status='Captured',
                    created_at=created_date,
                    paid_at=created_date + timedelta(hours=1),
                    locations=buyer.location
                )

                # Add shipping details for shipped orders
                if order.status in ['Shipped', 'In Transit', 'Delivered', 'Completed']:
                    order.shipped_at = created_date + timedelta(days=2)
                    order.tracking_id = f'TRACK{random.randint(100000, 999999)}'
                    order.eta = created_date + timedelta(days=random.randint(5, 14))
                    order.save()

    def _create_reviews(self, arts, buyers):
        """Create reviews for artworks"""
        now = timezone.now()

        for art in arts:
            # Create 2-8 reviews per art
            num_reviews = random.randint(2, 8)
            selected_buyers = random.sample(buyers, min(num_reviews, len(buyers)))

            for buyer in selected_buyers:
                days_ago = random.randint(1, 180)
                created_date = now - timedelta(days=days_ago)

                comments = [
                    "Beautiful artwork! Highly recommended.",
                    "Amazing quality and fast shipping.",
                    "Love the colors and composition.",
                    "Exactly as described. Very happy!",
                    "Great piece, fits perfectly in my living room.",
                    "The artist captured exactly what I wanted.",
                ]

                ArtReviews.objects.create(
                    art=art,
                    user=buyer,
                    rating=random.randint(3, 5),
                    comment=random.choice(comments),
                    created_at=created_date
                )

    def _create_comments(self, arts, buyers):
        """Create comments on artworks"""
        now = timezone.now()

        for art in arts:
            # Create 3-10 comments per art
            num_comments = random.randint(3, 10)

            for _ in range(num_comments):
                buyer = random.choice(buyers)
                days_ago = random.randint(1, 180)
                created_date = now - timedelta(days=days_ago)

                comments = [
                    "This is stunning!",
                    "Love the use of color here",
                    "What inspired this piece?",
                    "Beautiful work!",
                    "How much does this cost?",
                    "Is this available for purchase?",
                    "Incredible detail!",
                ]

                ArtComment.objects.create(
                    art=art,
                    user=buyer,
                    comment=random.choice(comments),
                    created_at=created_date
                )