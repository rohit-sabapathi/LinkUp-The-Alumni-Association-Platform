import razorpay
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Donation, DonationCampaign
from .serializers import DonationSerializer, DonationCampaignSerializer
from .permissions import IsAdminUser
import json
import hmac
import hashlib
import time

# Initialize Razorpay client with proper error handling
try:
    razorpay_client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )
except Exception as e:
    print(f"Failed to initialize Razorpay client: {str(e)}")
    razorpay_client = None

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_razorpay_key(request):
    """Get Razorpay API key for the frontend"""
    if not settings.RAZORPAY_KEY_ID:
        return Response({
            'error': 'Razorpay configuration missing',
            'message': 'Payment system is not properly configured'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
    return Response({
        'key_id': settings.RAZORPAY_KEY_ID,
        'currencies': dict(Donation.CURRENCY_CHOICES)
    })

class DonationListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Donation.objects.filter(donor=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            # Check if Razorpay is properly configured
            if not razorpay_client:
                return Response({
                    'error': 'Payment system error',
                    'message': 'Payment system is not properly configured'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # Validate amount first
            try:
                amount = float(request.data.get('amount', 0))
                if amount <= 0:
                    return Response({
                        'error': 'Invalid amount',
                        'message': 'Amount must be greater than 0'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({
                    'error': 'Invalid amount',
                    'message': 'Please provide a valid amount'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Prepare the initial data
            data = {
                'amount': amount,
                'currency': request.data.get('currency', settings.RAZORPAY_CURRENCY),
                'message': request.data.get('message', ''),
                'campaign': request.data.get('campaign'),
                'donor': request.user.id
            }

            # Validate the data with serializer
            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                return Response({
                    'error': 'Validation failed',
                    'message': 'Please check your input',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create Razorpay order
            try:
                order_data = {
                    'amount': int(amount * 100),  # Convert to paisa
                    'currency': data['currency'],
                    'receipt': f"order_{int(time.time())}_{request.user.id}",
                    'notes': {
                        'donor_id': str(request.user.id),
                        'donor_name': request.user.get_full_name(),
                        'donor_email': request.user.email,
                        'campaign_id': str(data['campaign']) if data['campaign'] else None,
                        'message': data['message']
                    }
                }
                
                order = razorpay_client.order.create(data=order_data)
                
                # Save the donation
                donation = serializer.save(
                    donor=request.user,
                    razorpay_order_id=order['id'],
                    status='pending',
                    notes=order_data['notes']
                )
                
                return Response({
                    'id': donation.id,
                    'amount': float(donation.amount),
                    'currency': donation.currency,
                    'razorpay_order_id': order['id'],
                    'notes': order_data['notes']
                })
                
            except razorpay.errors.BadRequestError as e:
                return Response({
                    'error': 'Razorpay error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': 'Server error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    try:
        # Get payment verification data
        params_dict = {
            'razorpay_payment_id': request.data.get('razorpay_payment_id'),
            'razorpay_order_id': request.data.get('razorpay_order_id'),
            'razorpay_signature': request.data.get('razorpay_signature')
        }

        try:
            # Verify signature
            razorpay_client.utility.verify_payment_signature(params_dict)
            
            # Get payment details from Razorpay
            payment = razorpay_client.payment.fetch(params_dict['razorpay_payment_id'])
            
            # Update donation status
            donation = Donation.objects.get(razorpay_order_id=params_dict['razorpay_order_id'])
            donation.razorpay_payment_id = params_dict['razorpay_payment_id']
            donation.razorpay_signature = params_dict['razorpay_signature']
            donation.status = 'successful'
            donation.save()

            # Update campaign amount if this donation is for a campaign
            if donation.campaign:
                campaign = donation.campaign
                campaign.current_amount += donation.amount
                campaign.save()

            return Response({
                'status': 'success',
                'payment_id': payment['id'],
                'order_id': payment['order_id'],
                'method': payment.get('method', ''),
                'amount': float(payment['amount']) / 100,  # Convert from smallest currency unit
                'currency': payment['currency'],
                'email': payment['email'],
                'contact': payment.get('contact', ''),
                'message': 'Payment verified successfully'
            })
            
        except Exception as e:
            # Update donation status to failed
            donation = Donation.objects.get(razorpay_order_id=params_dict['razorpay_order_id'])
            donation.status = 'failed'
            donation.save()
            
            return Response({
                'status': 'failed',
                'error': str(e),
                'message': 'Payment verification failed'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e),
            'message': 'Invalid payment verification request'
        }, status=status.HTTP_400_BAD_REQUEST)

class DonationCampaignListCreateView(generics.ListCreateAPIView):
    queryset = DonationCampaign.objects.filter(is_active=True)
    serializer_class = DonationCampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

class DonationCampaignDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DonationCampaign.objects.all()
    serializer_class = DonationCampaignSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser] 