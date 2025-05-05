import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { getAllMentors } from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';

const MentorCard = ({ mentor }) => {
  const skills = mentor.skills_list || [];

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 hover:border-purple-700/50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {mentor.user.profile_image ? (
            <img 
              src={mentor.user.profile_image} 
              alt={`${mentor.user.first_name} ${mentor.user.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
              <UserCircleIcon className="w-12 h-12 text-slate-500" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-200">
            {mentor.user.first_name} {mentor.user.last_name}
          </h3>
          
          <div className="flex items-center mt-1 mb-2">
            <AcademicCapIcon className="h-4 w-4 text-purple-400 mr-1" />
            <span className="text-sm text-slate-400">
              {mentor.years_of_experience} years of experience
            </span>
          </div>
          
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {mentor.bio}
          </p>
          
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {skills.slice(0, 3).map((skill, index) => (
                <span 
                  key={index} 
                  className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/30"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-full bg-slate-700/80 text-slate-400">
                  +{skills.length - 3} more
                </span>
              )}
            </div>
          )}
          
          <Link 
            to={`/mentorship/mentors/${mentor.id}`}
            className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

const FindMentor = () => {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  
  // Get all unique skills from mentors
  const allSkills = [...new Set(
    mentors.flatMap(mentor => mentor.skills_list || [])
  )].sort();

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const data = await getAllMentors();
        setMentors(data);
        setFilteredMentors(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching mentors:', error);
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  useEffect(() => {
    // Filter mentors based on search query and selected skill
    let result = mentors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(mentor => 
        mentor.user.first_name.toLowerCase().includes(query) ||
        mentor.user.last_name.toLowerCase().includes(query) ||
        mentor.bio.toLowerCase().includes(query) ||
        (mentor.skills_list && mentor.skills_list.some(skill => 
          skill.toLowerCase().includes(query)
        ))
      );
    }

    if (selectedSkill) {
      result = result.filter(mentor => 
        mentor.skills_list && mentor.skills_list.includes(selectedSkill)
      );
    }

    setFilteredMentors(result);
  }, [searchQuery, selectedSkill, mentors]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <Spinner size="large" text="Loading mentors..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-400">Find a Mentor</h1>
        <Link 
          to="/smartnest/mentorship"
          className="text-sm text-slate-400 hover:text-slate-300"
        >
          Back to Mentorship
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800/30 rounded-lg p-4 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-500" />
            </div>
            <input
              type="text"
              className="bg-slate-700/50 border border-slate-600 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Search by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Skill filter */}
          <div className="col-span-2">
            <select
              className="bg-slate-700/50 border border-slate-600 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="">Filter by skill (all)</option>
              {allSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mentors list */}
      {filteredMentors.length > 0 ? (
        <div className="space-y-6">
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800/30 rounded-lg">
          <AcademicCapIcon className="h-12 w-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-slate-300 font-medium mb-1">No mentors found</h3>
          <p className="text-slate-500 text-sm">
            {searchQuery || selectedSkill 
              ? "Try adjusting your search filters" 
              : "Check back later for available mentors"}
          </p>
        </div>
      )}
    </div>
  );
};

export default FindMentor; 