from rest_framework import serializers
from .models import Donation, DonationCampaign

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    campaign = serializers.PrimaryKeyRelatedField(
        queryset=DonationCampaign.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Donation
        fields = [
            'id', 'donor', 'donor_name', 'amount', 'currency', 'razorpay_order_id',
            'razorpay_payment_id', 'status', 'message', 'created_at', 'campaign',
            'notes'
        ]
        read_only_fields = [
            'donor', 'razorpay_order_id', 'razorpay_payment_id',
            'razorpay_signature', 'status', 'notes'
        ]

    def get_donor_name(self, obj):
        return obj.donor.get_full_name()

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value

    def validate_campaign(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError("This campaign is not active.")
        return value

    def validate_currency(self, value):
        valid_currencies = dict(Donation.CURRENCY_CHOICES).keys()
        if value not in valid_currencies:
            raise serializers.ValidationError(f"Invalid currency. Choose from: {', '.join(valid_currencies)}")
        return value

class DonationCampaignSerializer(serializers.ModelSerializer):
    total_donations = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    organizer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DonationCampaign
        fields = [
            'id', 'title', 'description', 'goal_amount', 'current_amount',
            'start_date', 'end_date', 'image', 'is_active', 'created_at',
            'total_donations', 'progress_percentage', 'organizer', 'organizer_name'
        ]
        read_only_fields = ['current_amount', 'organizer']

    def get_total_donations(self, obj):
        return obj.donations.count()

    def get_progress_percentage(self, obj):
        if obj.goal_amount == 0:
            return 0
        return round((obj.current_amount / obj.goal_amount) * 100, 2)

    def get_organizer_name(self, obj):
        return obj.organizer.get_full_name()

    def create(self, validated_data):
        # Set the organizer to the current user
        validated_data['organizer'] = self.context['request'].user
        return super().create(validated_data) 