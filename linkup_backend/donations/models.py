from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

class DonationCampaign(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    goal_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    current_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    image = models.ImageField(upload_to='campaign_images/', null=True, blank=True)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_donation_campaigns'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def progress_percentage(self):
        if self.goal_amount == 0:
            return 0
        return (self.current_amount / self.goal_amount) * 100

class Donation(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed')
    ]

    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
    ]

    donor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='razorpay_donations')
    campaign = models.ForeignKey(DonationCampaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='INR')
    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, null=True)
    notes = models.JSONField(default=dict, blank=True)  # For storing Razorpay notes
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Donation of {self.currency} {self.amount} by {self.donor.get_full_name()}" 