import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Smartphone, 
  Megaphone, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  Key, 
  MoreVertical,
  Layers,
  Sparkles,
  TrendingUp,
  Building2,
  Trash2,
  Edit3
} from 'lucide-react';
import { UserAccount, PlanTier, AccountStatus, UserRole } from '../../types';

interface UserManagementProps {
  users: UserAccount[];
  onAddUser: (user: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin' | 'broadcastsUsed' | 'apiCallsThisMonth'>) => void;
  onUpdateStatus: (userId: string, status: AccountStatus) => void;
  onUpdateQuotas: (userId: string, sessionQuota: number, broadcastLimit: number) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateStatus,
  onUpdateQuotas,
  onDeleteUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserRole>('tenant_admin');
  const [plan, setPlan] = useState<PlanTier>('growth');
  const [sessionQuota, setSessionQuota] = useState(5);
  const [broadcastLimit, setBroadcastLimit] = useState(50000);
  const [teamSeats, setTeamSeats] = useState(8);

  // Edit quota state
  const [editSessionQuota, setEditSessionQuota] = useState(5);
  const [editBroadcastLimit, setEditBroadcastLimit] = useState(50000);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || u.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !company) return;

    onAddUser({
      name,
      email,
      avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 1000)}?w=120&auto=format&fit=crop&q=80`,
      role,
      company,
      plan,
      status: 'active',
      whatsappSessionsQuota: sessionQuota,
      activeSessionsCount: 0,
      monthlyBroadcastLimit: broadcastLimit,
      teamSeats
    });

    setName('');
    setEmail('');
    setCompany('');
    setIsAddModalOpen(false);
  };

  const handleSaveQuotas = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateQuotas(editingUser.id, editSessionQuota, editBroadcastLimit);
      setEditingUser(null);
    }
  };

  // KPIs
  const totalTenants = users.length;
  const totalActiveSessions = users.reduce((acc, curr) => acc + curr.activeSessionsCount, 0);
  const totalBroadcastsSent = users.reduce((acc, curr) => acc + curr.broadcastsUsed, 0);
  const totalSavedDollars = (totalBroadcastsSent * 0.05);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Tenant & User Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provision workspaces, allocate WhatsApp Chromium session quotas, assign broadcast limits, and monitor usage.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Tenant User</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">Total Registered Tenants</div>
          <div className="text-2xl font-black text-white mt-1">{totalTenants}</div>
          <div className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1 font-medium">
            <Building2 className="w-3 h-3" />
            <span>Across D2C, Retail & Logistics</span>
          </div>
        </div>

        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">Active WhatsApp Numbers</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalActiveSessions} Numbers</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Live Puppeteer sessions running
          </div>
        </div>

        <div className="bg-[#111b21] border border-[#2a3942] p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-medium">Broadcasts Dispatched (MTD)</div>
          <div className="text-2xl font-black text-white mt-1">{totalBroadcastsSent.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>98.6% Avg Delivery Rate</span>
          </div>
        </div>

        <div className="bg-[#111b21] border border-emerald-500/30 p-4 rounded-2xl bg-gradient-to-br from-[#111b21] to-[#12231b]">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Meta Markup Avoided</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black text-white mt-1">${totalSavedDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-300 mt-1">
            Direct WppFlow Session bypass
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111b21] p-3 rounded-2xl border border-[#2a3942] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenant, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-[#202c33] border border-[#2a3942] rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#202c33]">All Plans</option>
              <option value="enterprise" className="bg-[#202c33]">Enterprise</option>
              <option value="growth" className="bg-[#202c33]">Growth</option>
              <option value="starter" className="bg-[#202c33]">Starter</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#202c33] border border-[#2a3942] rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#202c33]">All Statuses</option>
              <option value="active" className="bg-[#202c33]">Active</option>
              <option value="suspended" className="bg-[#202c33]">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#202c33]/50 border-b border-[#2a3942] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Tenant / User</th>
                <th className="py-3.5 px-4">Plan & Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">WhatsApp Quotas</th>
                <th className="py-3.5 px-4">Broadcasts (MTD)</th>
                <th className="py-3.5 px-4">Seats</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3942]/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#202c33]/30 transition-colors">
                  
                  {/* User info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-white text-xs">{user.name}</div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                        <div className="text-[10px] text-indigo-400 font-medium mt-0.5">{user.company}</div>
                      </div>
                    </div>
                  </td>

                  {/* Plan & Role */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.plan === 'enterprise'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                          : user.plan === 'growth'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {user.plan}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      user.status === 'active'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="capitalize">{user.status}</span>
                    </span>
                  </td>

                  {/* Quotas */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold">
                          {user.activeSessionsCount} / {user.whatsappSessionsQuota} Sessions
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {Math.round((user.activeSessionsCount / user.whatsappSessionsQuota) * 100)}%
                        </span>
                      </div>
                      <div className="w-32 bg-[#202c33] h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (user.activeSessionsCount / user.whatsappSessionsQuota) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Broadcasts */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="text-xs text-white font-medium">
                        {user.broadcastsUsed.toLocaleString()} <span className="text-slate-400 text-[11px]">/ {user.monthlyBroadcastLimit.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                        Saved ${(user.broadcastsUsed * 0.05).toFixed(0)} vs Meta
                      </div>
                    </div>
                  </td>

                  {/* Seats */}
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {user.teamSeats} Seats
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Quota Edit */}
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setEditSessionQuota(user.whatsappSessionsQuota);
                          setEditBroadcastLimit(user.monthlyBroadcastLimit);
                        }}
                        title="Adjust Quotas"
                        className="p-1.5 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 hover:text-white rounded-lg transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Suspend / Activate */}
                      <button
                        onClick={() => onUpdateStatus(user.id, user.status === 'active' ? 'suspended' : 'active')}
                        title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                        className={`p-1.5 rounded-lg transition-all ${
                          user.status === 'active'
                            ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/50'
                            : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50'
                        }`}
                      >
                        {user.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        title="Delete User"
                        className="p-1.5 bg-[#202c33] hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-[#2a3942] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Create New Tenant Account</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="liam@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Apparel D2C"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Subscription Tier</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as PlanTier)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="starter">Starter ($49/mo)</option>
                    <option value="growth">Growth ($149/mo)</option>
                    <option value="enterprise">Enterprise ($399/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="tenant_admin">Tenant Administrator</option>
                    <option value="agent">Support / Sales Agent</option>
                    <option value="superadmin">Platform Superadmin</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#202c33] rounded-xl space-y-3 border border-[#2a3942]">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Allocated WhatsApp Sessions (WppFlow Engine)</span>
                  <span className="text-emerald-400 font-bold">{sessionQuota} Numbers</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={sessionQuota}
                  onChange={(e) => setSessionQuota(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 session</span>
                  <span>10 sessions</span>
                  <span>25 sessions</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Monthly Broadcast Limit</label>
                  <input
                    type="number"
                    value={broadcastLimit}
                    onChange={(e) => setBroadcastLimit(parseInt(e.target.value))}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Team Seats</label>
                  <input
                    type="number"
                    value={teamSeats}
                    onChange={(e) => setTeamSeats(parseInt(e.target.value))}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-300 rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-semibold shadow-md shadow-indigo-900/30"
                >
                  Create Tenant Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quota Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-[#2a3942] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Adjust Quota Limits</h2>
                <p className="text-xs text-slate-400">{editingUser.company} ({editingUser.email})</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuotas} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Max WhatsApp Sessions (Chromium Nodes)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={editSessionQuota}
                    onChange={(e) => setEditSessionQuota(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-mono text-emerald-400 font-bold text-sm w-10 text-right">
                    {editSessionQuota}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Monthly Free Broadcast Limit</label>
                <input
                  type="number"
                  step="1000"
                  value={editBroadcastLimit}
                  onChange={(e) => setEditBroadcastLimit(parseInt(e.target.value))}
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-[#202c33] text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold"
                >
                  Save Quotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
