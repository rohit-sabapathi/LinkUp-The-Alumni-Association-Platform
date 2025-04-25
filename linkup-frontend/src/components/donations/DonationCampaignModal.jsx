import React from 'react';

const DonationCampaignModal = ({ campaign, onClose }) => {
    if (!campaign) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-slate-100">{campaign.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Campaign Image */}
                    {campaign.image && (
                        <div className="mb-6">
                            <img
                                src={campaign.image}
                                alt={campaign.title}
                                className="w-full h-64 object-cover rounded-lg"
                            />
                        </div>
                    )}

                    {/* Campaign Details */}
                    <div className="space-y-6">
                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">About this Campaign</h3>
                            <p className="text-slate-300 whitespace-pre-wrap">{campaign.description}</p>
                        </div>

                        {/* Progress */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2">Campaign Progress</h3>
                            <div className="bg-slate-700 rounded-lg p-4">
                                <div className="flex justify-between text-sm text-slate-300 mb-2">
                                    <span>Progress</span>
                                    <span>{campaign.progress_percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-600 rounded-full h-2.5 mb-2">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${campaign.progress_percentage}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300">
                                        Raised: ₹{campaign.current_amount}
                                    </span>
                                    <span className="text-slate-300">
                                        Goal: ₹{campaign.goal_amount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Campaign Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-slate-400">Start Date</h4>
                                <p className="text-slate-200">
                                    {new Date(campaign.start_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-400">End Date</h4>
                                <p className="text-slate-200">
                                    {new Date(campaign.end_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Organizer Info */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-400">Campaign Organizer</h4>
                            <p className="text-slate-200">{campaign.organizer_name}</p>
                        </div>

                        {/* Total Donations */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-400">Total Donations</h4>
                            <p className="text-slate-200">{campaign.total_donations} donations received</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonationCampaignModal; 