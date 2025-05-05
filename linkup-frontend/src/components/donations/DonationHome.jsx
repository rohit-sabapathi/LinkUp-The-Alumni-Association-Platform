import { useState, useEffect } from 'react';
import { donationAPI } from '../../services/donationApi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import DonationCampaignModal from './DonationCampaignModal';

// Constants for Razorpay configuration
const RAZORPAY_COMPANY_NAME = 'LinkUp Alumni Association';
const RAZORPAY_DESCRIPTION = 'Alumni Association Donation';

const DonationHome = () => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
    const [currencies, setCurrencies] = useState({});
    const [selectedCurrency, setSelectedCurrency] = useState('INR');
    const [razorpayKey, setRazorpayKey] = useState('');
    const [newCampaign, setNewCampaign] = useState({
        title: '',
        description: '',
        goal_amount: '',
        start_date: '',
        end_date: '',
        image: null
    });
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        loadCampaigns();
        loadRazorpayConfig();
    }, []);

    const loadRazorpayConfig = async () => {
        try {
            const response = await donationAPI.getRazorpayKey();
            setRazorpayKey(response.data.key_id);
            setCurrencies(response.data.currencies);
        } catch (error) {
            console.error('Failed to load Razorpay config:', error);
            toast.error('Failed to load payment configuration');
        }
    };

    const loadCampaigns = async () => {
        try {
            setLoadingCampaigns(true);
            const response = await donationAPI.getCampaigns();
            setCampaigns(response?.data || []);
        } catch (error) {
            console.error('Failed to load campaigns:', error);
            toast.error('Failed to load donation campaigns');
            setCampaigns([]);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const handleDonation = async (e, campaignId = null) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            
            if (!razorpayKey) {
                throw new Error('Payment configuration not loaded');
            }

            // Check authentication
            if (!user) {
                toast.error('Please log in to make a donation');
                window.location.href = '/login';
                return;
            }

            // Create donation record
            const donationResponse = await donationAPI.createDonation({
                amount: parseFloat(amount),
                currency: selectedCurrency,
                message,
                campaignId
            });

            // Initialize Razorpay
            const options = {
                key: razorpayKey,
                amount: donationResponse.amount * 100,  // amount in paisa
                currency: donationResponse.currency,
                name: RAZORPAY_COMPANY_NAME,
                description: campaignId ? 'Campaign Donation' : RAZORPAY_DESCRIPTION,
                order_id: donationResponse.razorpay_order_id,
                notes: donationResponse.notes,
                prefill: {
                    name: user.first_name + ' ' + user.last_name,
                    email: user.email,
                },
                handler: async function (response) {
                    try {
                        await donationAPI.verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        toast.success('Thank you for your donation!');
                        setAmount('');
                        setMessage('');
                        loadCampaigns();
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        toast.error(error.message || 'Payment verification failed');
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                        toast.error('Payment cancelled');
                    },
                    escape: true,
                    confirm_close: true
                },
                theme: {
                    color: '#2563eb'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                setLoading(false);
                toast.error(response.error.description || 'Payment failed');
            });
            razorpay.open();
        } catch (error) {
            console.error('Failed to process donation:', error);
            const errorMessage = error.message || 'Failed to process donation';
            
            if (errorMessage.toLowerCase().includes('log in')) {
                window.location.href = '/login';
            }
            
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewCampaign({ ...newCampaign, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(newCampaign).forEach(key => {
                if (newCampaign[key] !== null) {
                    formData.append(key, newCampaign[key]);
                }
            });

            await donationAPI.createCampaign(formData);
            toast.success('Campaign created successfully!');
            setShowNewCampaignForm(false);
            setNewCampaign({
                title: '',
                description: '',
                goal_amount: '',
                start_date: '',
                end_date: '',
                image: null
            });
            setImagePreview(null);
            loadCampaigns();
        } catch (error) {
            console.error('Failed to create campaign:', error);
            toast.error('Failed to create campaign');
        }
    };

    const renderDonationForm = (campaignId = null) => (
        <form onSubmit={(e) => handleDonation(e, campaignId)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Amount
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                        min="1"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Currency
                    </label>
                    <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                    >
                        {Object.entries(currencies).map(([code, name]) => (
                            <option key={code} value={code}>
                                {code} - {name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {!campaignId && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Message (Optional)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message with your donation"
                        className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                        rows="3"
                    />
                </div>
            )}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Processing...' : 'Donate Now'}
            </button>
        </form>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 mb-2">Support Your Alumni Association</h1>
                        <p className="text-slate-400">Your contribution helps us organize better events and support our community.</p>
                    </div>
                    {user && (
                        <button
                            onClick={() => setShowNewCampaignForm(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create Campaign
                        </button>
                    )}
                </div>
            </div>

            {/* New Campaign Modal */}
            {showNewCampaignForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-slate-100">Create New Campaign</h2>
                                <button
                                    onClick={() => {
                                        setShowNewCampaignForm(false);
                                        setNewCampaign({
                                            title: '',
                                            description: '',
                                            goal_amount: '',
                                            start_date: '',
                                            end_date: '',
                                            image: null
                                        });
                                        setImagePreview(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateCampaign} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Campaign Title
                                    </label>
                                    <input
                                        type="text"
                                        value={newCampaign.title}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                                        className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newCampaign.description}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                        className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Goal Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={newCampaign.goal_amount}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, goal_amount: e.target.value })}
                                        className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newCampaign.start_date}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                                            className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newCampaign.end_date}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                                            className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Campaign Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                                    />
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewCampaignForm(false);
                                            setNewCampaign({
                                                title: '',
                                                description: '',
                                                goal_amount: '',
                                                start_date: '',
                                                end_date: '',
                                                image: null
                                            });
                                            setImagePreview(null);
                                        }}
                                        className="px-4 py-2 text-slate-300 hover:text-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create Campaign
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Campaigns */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-slate-100">Active Campaigns</h2>
                </div>

                {loadingCampaigns ? (
                    <div className="text-center text-slate-400 py-8">Loading campaigns...</div>
                ) : campaigns && campaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((campaign) => (
                            <div key={campaign.id} className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                                <div 
                                    className="cursor-pointer transition-opacity hover:opacity-90"
                                    onClick={() => setSelectedCampaign(campaign)}
                                >
                                    {campaign.image && (
                                        <img
                                            src={campaign.image}
                                            alt={campaign.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-slate-100 mb-2">{campaign.title}</h3>
                                        <p className="text-slate-400 mb-4 line-clamp-2">{campaign.description}</p>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-slate-300 mb-1">
                                                <span>Progress</span>
                                                <span>{campaign.progress_percentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${campaign.progress_percentage}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-400 mt-1">
                                                <span>₹{campaign.current_amount}</span>
                                                <span>₹{campaign.goal_amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 pb-6">
                                    <form onSubmit={(e) => handleDonation(e, campaign.id)} className="space-y-4">
                                        <div>
                                            <input
                                                type="number"
                                                placeholder="Enter amount"
                                                className="w-full bg-slate-900/50 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                min="1"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Processing...' : 'Donate Now'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-8">No active campaigns</div>
                )}
            </div>

            {/* Campaign Details Modal */}
            {selectedCampaign && (
                <DonationCampaignModal
                    campaign={selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                />
            )}

            {/* General Donation Form */}
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Make a General Donation</h2>
                {renderDonationForm()}
            </div>
        </div>
    );
};

export default DonationHome; 