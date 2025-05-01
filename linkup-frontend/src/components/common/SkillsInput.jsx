import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SkillsInput = ({ selectedSkills, onSkillsChange }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Common skills data (this would ideally come from an API)
  const commonSkills = [
    // Technology
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Angular', 'Vue.js',
    'Django', 'Flask', 'Spring Boot', 'Docker', 'Kubernetes', 'AWS', 'Azure',
    'Machine Learning', 'Data Science', 'Artificial Intelligence', 'DevOps',
    
    // EEE
    'Circuit Design', 'Power Systems', 'Control Systems', 'Microcontrollers',
    'Digital Electronics', 'Analog Electronics', 'VLSI Design', 'Power Electronics',
    'Electric Drives', 'Embedded Systems',
    
    // ECE
    'Signal Processing', 'Communication Systems', 'RF Design', 'Antenna Design',
    'Microwave Engineering', 'Digital Communication', 'FPGA', 'Verilog', 'VHDL',
    
    // Mechanical
    'CAD', 'CAM', 'Thermal Engineering', 'Fluid Mechanics', 'Robotics',
    'Manufacturing Processes', 'Automation', 'HVAC', '3D Printing', 'CNC Programming',
    
    // Agricultural
    'Crop Science', 'Soil Science', 'Irrigation Systems', 'Agricultural Machinery',
    'Precision Farming', 'Sustainable Agriculture', 'Pest Management', 'Hydroponics'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setIsLoading(true);

    // Filter suggestions based on input
    const filtered = commonSkills.filter(skill =>
      skill.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(true);
    setIsLoading(false);
  };

  const addSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      onSkillsChange([...selectedSkills, skill]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeSkill = (skillToRemove) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700 min-h-[42px]">
        {selectedSkills.map((skill, index) => (
          <div key={`skill-${index}-${skill}`} className="flex items-center bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-md mr-2 mb-2">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-1 focus:outline-none"
            >
              <XMarkIcon className="h-4 w-4 text-indigo-400 hover:text-indigo-300" />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={selectedSkills.length === 0 ? "Type to search skills..." : ""}
          className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-sm"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addSkill(suggestion)}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsInput; 