import axios from './axios';

export const donationAPI = {
    // Campaign endpoints
    getCampaigns: () => axios.get('/api/donations/campaigns/'),
    getCampaign: (id) => axios.get(`/api/donations/campaigns/${id}/`),
    createCampaign: (data) => axios.post('/api/donations/campaigns/', data),
    updateCampaign: (id, data) => axios.put(`/api/donations/campaigns/${id}/`, data),
    deleteCampaign: (id) => axios.delete(`/api/donations/campaigns/${id}/`),

    // Payment endpoints
    getRazorpayKey: () => axios.get('/api/donations/key/'),
    
    createDonation: async (data) => {
        try {
            // Validate amount
            const amount = parseFloat(data.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            // Create donation
            const response = await axios.post('/api/donations/', {
                amount: amount,
                currency: data.currency || 'INR',
                message: data.message || '',
                campaign: data.campaignId || null
            });

            if (!response.data) {
                throw new Error('No response data received');
            }

            return response.data;
        } catch (error) {
            console.error('Donation creation error:', error.response?.data || error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to create donation');
        }
    },

    verifyPayment: async (data) => {
        try {
            const response = await axios.post('/api/donations/verify/', data);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Payment verification failed');
        }
    }
}; 