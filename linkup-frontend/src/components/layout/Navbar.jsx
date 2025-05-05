import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    HomeIcon,
    BriefcaseIcon,
    UsersIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon,
    HeartIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
    const { user } = useAuth();
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
                    <div className="hidden md:flex space-x-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                                    isActive(link.path)
                                        ? 'bg-blue-600/20 text-blue-400'
                                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
                                }`}
                            >
                                <link.icon className="h-5 w-5" />
                                <span>{link.label}</span>
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
                        <NotificationBell />
                        {user && (
                            <Link
                                to={`/profile/${user?.id}`}
                                className="flex items-center space-x-2 p-1.5 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 rounded-lg transition-colors"
                            >
                                {user.profile_picture ? (
                                    <img
                                        src={user.profile_picture}
                                        alt={user.full_name || "User"}
                                        className="w-10 h-10 rounded-full object-cover border-4 border-blue-600"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                                        <span className="text-l text-slate-300">
                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                                        </span>
                                    </div>
                                )}
                            </Link>
                        )}
                        {!user && (
                            <Link
                                to="/login"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
