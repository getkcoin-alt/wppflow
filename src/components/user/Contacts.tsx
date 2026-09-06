import React, { useState } from 'react';
import { 
  Users2, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Tag, 
  Phone, 
  Mail, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { Contact } from '../../types';

interface ContactsProps {
  contacts: Record<string, Contact>;
  onSelectChat: (contactId: string) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ contacts, onSelectChat }) => {
  const [search, setSearch] = useState('');
  const contactList = Object.values(contacts);

  const filtered = contactList.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111b21] p-5 rounded-2xl border border-[#2a3942]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">CRM Contacts & Audience Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unified WhatsApp audience directory enriched with Shopify order history, tags, and lifetime value.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-[#202c33] hover:bg-[#2a3942] text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#2a3942] transition-all">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import CSV</span>
          </button>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/30">
            <Download className="w-4 h-4" />
            <span>Export Audience</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#111b21] p-3 rounded-2xl border border-[#2a3942] flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone (+33...), or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filtered.length} of {contactList.length} Contacts
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#202c33]/50 border-b border-[#2a3942] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Phone / WhatsApp</th>
                <th className="py-3.5 px-4">Tags & Segment</th>
                <th className="py-3.5 px-4">Shopify LTV</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4">Assigned Agent</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3942]/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#202c33]/30 transition-colors">
                  
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-white text-xs">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {c.phone}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {c.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-[#202c33] text-slate-300 border border-[#2a3942] text-[10px] font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    ${c.lifetimeValue.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.orders.length} orders</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {c.assignedAgent || 'Unassigned'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectChat(c.id)}
                      className="px-3 py-1.5 bg-[#202c33] hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-xl text-xs font-semibold transition-all"
                    >
                      Open Chat
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
