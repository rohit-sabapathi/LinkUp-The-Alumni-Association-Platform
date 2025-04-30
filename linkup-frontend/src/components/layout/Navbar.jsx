import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    HomeIcon,
    BriefcaseIcon,
    UsersIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon,
    BellIcon,
    HeartIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navLinks = [
        { path: '/', icon: HomeIcon, label: 'Feed' },
        { path: '/jobs', icon: BriefcaseIcon, label: 'Jobs' },
        { path: '/networking', icon: UsersIcon, label: 'Networking' },
        { path: '/smartnest', icon: LightBulbIcon, label: 'SmartNest' },
        { path: '/events', icon: CalendarIcon, label: 'Events' },
        { path: '/donations', icon: HeartIcon, label: 'Donate' },
    ];

    return (
        <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-bold text-blue-500">
                        LinkUp
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive(link.path)
                                        ? 'bg-blue-600/20 text-blue-400'
                                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
                                }`}
                            >
                                <link.icon className="h-5 w-5 mr-1.5" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side icons */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/messages"
                            className={`p-2 rounded-lg transition-colors ${
                                isActive('/messages')
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
                            }`}
                        >
                            <ChatBubbleLeftRightIcon className="h-6 w-6" />
                        </Link>
                        <button className="p-2 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 rounded-lg transition-colors">
                            <BellIcon className="h-6 w-6" />
                        </button>
                        <Link
                            to={`/profile/${user?.id}`}
                            className="flex items-center space-x-2 p-1.5 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 rounded-lg transition-colors"
                        >
                            <img
                                src={user?.profile_picture || 'https://via.placeholder.com/32'}
                                alt="Profile"
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
