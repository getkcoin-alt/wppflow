import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { LogIn, UserPlus, ShieldCheck, Lock, Mail, User, Building2, Sparkles, CheckCircle2, AlertCircle, X, Database } from 'lucide-react';
import confetti from 'canvas-confetti';
import { loginUser, signupUser, setStoredToken } from '../../services/api';
export const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);
        try {
            if (mode === 'login') {
                const res = await loginUser(email, password);
                if (res.status === 'success' && res.token && res.user) {
                    setStoredToken(res.token);
                    setSuccessMsg('Authentication successful! Loading workspace...');
                    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                    setTimeout(() => {
                        onAuthSuccess(res.user, res.token);
                        onClose();
                    }, 800);
                }
                else {
                    setError(res.message || 'Login failed. Please verify your credentials.');
                }
            }
            else {
                // Signup
                const res = await signupUser(name, email, password, companyName, role);
                if (res.status === 'success' && res.token && res.user) {
                    setStoredToken(res.token);
                    setSuccessMsg('Account registered in Railway PostgreSQL! Welcome aboard.');
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    setTimeout(() => {
                        onAuthSuccess(res.user, res.token);
                        onClose();
                    }, 1000);
                }
                else {
                    setError(res.message || 'Signup failed. Please try again.');
                }
            }
        }
        catch (err) {
            setError(err.message || 'Unable to connect to authentication server');
        }
        finally {
            setLoading(false);
        }
    };
    const fillQuickDemo = (type) => {
        setError(null);
        setSuccessMsg(null);
        setMode('login');
        if (type === 'admin') {
            setEmail('admin@wppflow.io');
            setPassword('admin123');
        }
        else {
            setEmail('demo@wppflow.io');
            setPassword('demo123');
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-[#111b21] border border-[#2a3942] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in relative", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#202c33] transition-all", children: _jsx(X, { className: "w-5 h-5" }) }), _jsxs("div", { className: "p-6 pb-4 border-b border-[#2a3942] bg-gradient-to-b from-[#182229] to-[#111b21]", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30", children: _jsx(ShieldCheck, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-lg font-bold text-white tracking-tight", children: "WppFlow Account" }), _jsxs("span", { className: "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800", children: [_jsx(Database, { className: "w-2.5 h-2.5" }), "PostgreSQL"] })] }), _jsx("p", { className: "text-xs text-slate-400", children: mode === 'login' ? 'Sign in to access your WhatsApp multi-session CRM' : 'Register a new tenant organization in Railway DB' })] })] }), _jsxs("div", { className: "flex bg-[#202c33] p-1 rounded-xl border border-[#2a3942] mt-4", children: [_jsxs("button", { type: "button", onClick: () => { setMode('login'); setError(null); }, className: `flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'login' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`, children: [_jsx(LogIn, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Sign In" })] }), _jsxs("button", { type: "button", onClick: () => { setMode('signup'); setError(null); }, className: `flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'signup' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`, children: [_jsx(UserPlus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Create Account" })] })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4 text-xs", children: [error && (_jsxs("div", { className: "flex items-start gap-2 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), successMsg && (_jsxs("div", { className: "flex items-start gap-2 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl", children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 shrink-0 mt-0.5" }), _jsx("span", { children: successMsg })] })), mode === 'signup' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 mb-1 font-medium", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "w-4 h-4 text-slate-400 absolute left-3 top-2.5" }), _jsx("input", { type: "text", required: true, placeholder: "e.g. John Doe", value: name, onChange: (e) => setName(e.target.value), className: "w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 mb-1 font-medium", children: "Organization / Brand Name" }), _jsxs("div", { className: "relative", children: [_jsx(Building2, { className: "w-4 h-4 text-slate-400 absolute left-3 top-2.5" }), _jsx("input", { type: "text", placeholder: "e.g. Acme Logistics", value: companyName, onChange: (e) => setCompanyName(e.target.value), className: "w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 mb-1 font-medium", children: "Initial Role" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { type: "button", onClick: () => setRole('user'), className: `p-2 rounded-xl border text-center transition-all ${role === 'user'
                                                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold'
                                                        : 'border-[#2a3942] bg-[#202c33] text-slate-400'}`, children: "User / Agent (5 Lines)" }), _jsx("button", { type: "button", onClick: () => setRole('admin'), className: `p-2 rounded-xl border text-center transition-all ${role === 'admin'
                                                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-400 font-bold'
                                                        : 'border-[#2a3942] bg-[#202c33] text-slate-400'}`, children: "Super Admin (25 Lines)" })] })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 mb-1 font-medium", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "w-4 h-4 text-slate-400 absolute left-3 top-2.5" }), _jsx("input", { type: "email", required: true, placeholder: "name@company.com", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-slate-300 mb-1 font-medium", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "w-4 h-4 text-slate-400 absolute left-3 top-2.5" }), _jsx("input", { type: "password", required: true, minLength: 6, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-900/30 mt-2", children: loading ? (_jsx("span", { children: "Authenticating with PostgreSQL..." })) : mode === 'login' ? (_jsxs(_Fragment, { children: [_jsx(LogIn, { className: "w-4 h-4" }), _jsx("span", { children: "Sign In to Dashboard" })] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "w-4 h-4" }), _jsx("span", { children: "Create Workspace & Sign In" })] })) }), _jsxs("div", { className: "pt-3 border-t border-[#2a3942] space-y-2", children: [_jsx("div", { className: "text-[11px] text-slate-400 font-medium", children: "One-Click Demo Credentials:" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("button", { type: "button", onClick: () => fillQuickDemo('admin'), className: "flex items-center justify-center gap-1.5 p-2 bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-slate-300 rounded-xl text-[11px] font-medium transition-all", children: [_jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-indigo-400" }), _jsx("span", { children: "Admin Demo" })] }), _jsxs("button", { type: "button", onClick: () => fillQuickDemo('user'), className: "flex items-center justify-center gap-1.5 p-2 bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-slate-300 rounded-xl text-[11px] font-medium transition-all", children: [_jsx(User, { className: "w-3.5 h-3.5 text-emerald-400" }), _jsx("span", { children: "User Demo" })] })] })] })] })] }) }));
};
