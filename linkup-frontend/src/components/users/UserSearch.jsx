import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { usersAPI } from '../../services/usersApi';
import UserCard from './UserCard';
import debounce from 'lodash/debounce';

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    graduationYear: '',
    userType: ''
  });

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query, filters) => {
    try {
      setLoading(true);
      setError(null);
        const response = await usersAPI.searchUsers(query, filters);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Failed to search users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
    }, 200),
    []
  );

  // Effect to trigger search when query or filters change
  useEffect(() => {
    debouncedSearch(searchQuery, filters);
    // Cleanup function to cancel pending debounced calls
    return () => debouncedSearch.cancel();
  }, [searchQuery, filters, debouncedSearch]);

  // Initial load of all users
  useEffect(() => {
    debouncedSearch('', {
      department: '',
      graduationYear: '',
      userType: ''
    });
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFollowChange = (userId, isFollowing) => {
    setSearchResults(results =>
      results.map(user =>
        user.id === userId ? { ...user, is_following: isFollowing } : user
      )
    );
  };

  const handleApplyFilters = () => {
    // Force a search with current filters
    debouncedSearch(searchQuery, filters);
  };

  const handleClearFilters = () => {
    setFilters({
      department: '',
      graduationYear: '',
      userType: ''
    });
  };

  const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Other'
  ];

  const userTypes = [
    { value: 'ALUMNI', label: 'Alumni' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'FACULTY', label: 'Faculty' }
  ];

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
              onChange={handleSearchChange}
            placeholder="Search users by name or email..."
              className="w-full bg-slate-900/50 text-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            {loading && (
              <div className="absolute right-3 top-3.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${hasActiveFilters ? 'text-blue-500' : 'text-slate-200'}`}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Graduation Year
                </label>
                <select
                  value={filters.graduationYear}
                  onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                >
                  <option value="">All Years</option>
                  {graduationYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  User Type
                </label>
                <select
                  value={filters.userType}
                  onChange={(e) => handleFilterChange('userType', e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                >
                  <option value="">All Types</option>
                  {userTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-slate-300 hover:text-slate-100"
              >
                Clear Filters
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {searchResults.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
          />
        ))}
        {searchResults.length === 0 && !loading && !error && (
          <div className="text-center text-slate-400 py-8">
            No users found {searchQuery ? `matching "${searchQuery}"` : 'with selected filters'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
