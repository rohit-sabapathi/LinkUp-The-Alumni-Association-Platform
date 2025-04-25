from django.urls import path
from . import views

urlpatterns = [
    # Donation campaign endpoints
    path('campaigns/', views.DonationCampaignListCreateView.as_view(), name='campaign-list-create'),
    path('campaigns/<int:pk>/', views.DonationCampaignDetailView.as_view(), name='campaign-detail'),
    
    # Donation endpoints
    path('', views.DonationListCreateView.as_view(), name='donation-list-create'),
    path('verify/', views.verify_payment, name='verify-payment'),
    path('key/', views.get_razorpay_key, name='get-razorpay-key'),
] 