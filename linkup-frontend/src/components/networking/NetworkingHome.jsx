import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import UserSearch from '../users/UserSearch';
import FollowersList from './FollowersList';
import FollowingList from './FollowingList';
import { useAuth } from '../../contexts/AuthContext';

const NetworkingHome = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-200 mb-2">Networking</h1>
        <p className="text-slate-400">Connect with alumni and students from your university</p>
      </div>
      
      <div className="bg-slate-800/50 rounded-lg p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 gap-4 mb-6">
            <TabsTrigger 
              value="search" 
              className="w-full py-2.5 text-sm font-medium transition-all"
            >
              Search Users
            </TabsTrigger>
            <TabsTrigger 
              value="followers" 
              className="w-full py-2.5 text-sm font-medium transition-all"
            >
              Followers
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="w-full py-2.5 text-sm font-medium transition-all"
            >
              Following
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-6 focus:outline-none">
            <UserSearch />
          </TabsContent>
          
          <TabsContent value="followers" className="mt-6 focus:outline-none">
            <FollowersList userId={user?.id} />
          </TabsContent>
          
          <TabsContent value="following" className="mt-6 focus:outline-none">
            <FollowingList userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NetworkingHome; 