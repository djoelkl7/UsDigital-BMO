import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  ArrowRightCircle,
  Calendar,
  Eye,
  EyeOff,
  TrendingUp,
  PieChart,
  Upload,
  UserPlus,
  Mail,
  Fingerprint as IDIcon,
  Globe,
  User as UserIcon,
  FileText,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sliders,
  Camera,
  ShieldAlert,
  Delete,
  Plus,
  Fingerprint
} from 'lucide-react';
import { Transaction, RecurringPayment, UserSettings, User, UserRole, UserStatus } from '../types';
import { AVATAR_STYLE_ARCHETYPES, PASSPORT_PHOTO_PRESETS } from '../constants';
import { ProfileAvatar } from './BrandLogo';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#263746]/55 backdrop-blur-xs" onClick={onClose} />
      <div
        className={`relative bg-white w-full ${maxWidth} rounded-2xl overflow-hidden animate-scale-in border border-[#E2EAF1] shadow-2xl flex flex-col max-h-[90vh] text-[#263746]`}
      >
        <div className="px-6 py-4 border-b border-[#E2EAF1] flex justify-between items-center bg-white shrink-0">
          <h3 className="text-base md:text-lg font-display font-bold text-[#263746] flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#E31B23]" />
            <span>{title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#263746] min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const UserProfileDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser?: (updated: User) => void;
}> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'PASSPORT' | 'AI_AVATAR' | 'PHOTO_STUDIO'>('DOSSIER');
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('executive_portrait');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!user) return null;

  const selectedArchetype = AVATAR_STYLE_ARCHETYPES.find(a => a.id === selectedArchetypeId) || AVATAR_STYLE_ARCHETYPES[0];
  const activePrompt = selectedArchetype.promptTemplate(user.name);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard?.writeText?.(activePrompt);
    setCopiedPrompt(true);
    showLocalToast('Prompt copied to clipboard');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleGenerateAvatar = () => {
    setIsGenerating(true);
    setGenerationStep(1);

    setTimeout(() => setGenerationStep(2), 600);
    setTimeout(() => setGenerationStep(3), 1200);
    setTimeout(() => {
      setGeneratedAvatarUrl(selectedArchetype.assetUrl);
      setIsGenerating(false);
      setGenerationStep(0);
      showLocalToast('Studio portrait ready');
    }, 1800);
  };

  const handleApplyAvatar = (urlToApply: string) => {
    const updatedUser: User = { ...user, passportUrl: urlToApply };
    if (onUpdateUser) onUpdateUser(updatedUser);
    showLocalToast('Profile photograph updated');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleApplyAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const cleanNameForMRZ = user.name.toUpperCase().replace(/[^A-Z]/g, '<');
  const mrzLine1 = `P<USB<${cleanNameForMRZ}${'<'.repeat(Math.max(0, 39 - cleanNameForMRZ.length))}`.slice(0, 44);
  const mrzLine2 = `${(user.idNumber || 'USB774920').replace(/[^A-Z0-9]/g, '')}<7USA8801011M3201014<<<<<<<<<<<<<<06`.slice(
    0,
    44
  );

  return (
    <Modal title="Account Profile & Identity Dossier" isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[#16865B] text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check size={15} /> {toastMessage}
            </span>
            <button type="button" onClick={() => setToastMessage(null)} className="text-[#16865B]">
              &times;
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#F3F7FB] rounded-xl text-xs font-semibold border border-[#E2EAF1]">
          {[
            { id: 'DOSSIER', icon: <UserIcon size={14} />, label: 'Dossier' },
            { id: 'PASSPORT', icon: <Globe size={14} />, label: 'ID Record' },
            { id: 'AI_AVATAR', icon: <Sparkles size={14} />, label: 'Portrait Studio' },
            { id: 'PHOTO_STUDIO', icon: <Camera size={14} />, label: 'Upload Photo' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id ? 'bg-[#367EAF] text-white' : 'text-slate-600 hover:text-[#263746]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'DOSSIER' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1]">
              <ProfileAvatar src={user.passportUrl} name={user.name} sizeClass="w-24 h-24" className="border-2 border-white shadow-sm" />

              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-display font-bold text-[#263746]">{user.name}</h3>
                <p className="text-slate-500 font-mono text-xs mt-0.5">@{user.username}</p>
                <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-[#28658F]">{user.accountTypeLabel || 'Personal Banking'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{user.currency || 'USD'}</span>
                  <span aria-hidden="true">·</span>
                  <span className={`font-semibold ${user.status === UserStatus.ACTIVE ? 'text-[#16865B]' : 'text-[#E31B23]'}`}>
                    {user.status === UserStatus.ACTIVE ? 'Active' : 'TEMPORARILY LOCKED'}
                  </span>
                </div>
                {user.status === UserStatus.LOCKED && user.lockReason && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2 text-left">
                    <ShieldAlert size={15} className="text-[#E31B23] shrink-0 mt-0.5" />
                    <span>{user.lockReason}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2EAF1] divide-y divide-slate-200 text-xs">
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail size={14} /> Registry Email
                </span>
                <span className="font-mono text-[#263746] font-medium">
                  {user.email || `${user.username.toLowerCase()}@usdigital-bmu.com`}
                </span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <IDIcon size={14} /> Reference Identifier
                </span>
                <span className="font-mono text-[#28658F] font-semibold">{user.idNumber || 'USB-774920-P'}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <FileText size={14} /> Available Balance
                </span>
                <span className="font-bold text-sm text-[#263746] font-mono tabular-nums">
                  ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {user.currency || 'USD'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PASSPORT' && (
          <div className="p-6 rounded-2xl bg-[#367EAF] text-white border border-[#4A90C6]">
            <div className="text-center pb-4 border-b border-white/10 mb-5">
              <p className="text-[11px] text-slate-300 tracking-[0.2em] uppercase font-semibold">
                UsDigital-<span className="text-[#E31B23]">BMU</span> Identity Record
              </p>
              <h3 className="text-lg font-display font-bold tracking-wider text-white mt-1">
                PROFILE IDENTITY SUMMARY
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div className="flex flex-col items-center">
                <div className="w-32 h-40 rounded-xl overflow-hidden border border-white/20 bg-[#4A90C6] relative">
                  <ProfileAvatar src={user.passportUrl} name={user.name} sizeClass="w-full h-full rounded-none border-0" />
                  <div className="absolute bottom-0 inset-x-0 bg-[#E31B23] text-white text-[10px] font-semibold text-center py-1">
                    VERIFIED PHOTOGRAPH
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Account Holder</p>
                    <p className="font-bold text-white text-sm truncate">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Account Type</p>
                    <p className="font-semibold text-slate-200">{user.accountTypeLabel || user.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Reference ID</p>
                    <p className="font-mono text-white font-semibold">{user.idNumber || 'USB-774920-P'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Account Status</p>
                    <p className={`font-semibold ${user.status === UserStatus.ACTIVE ? 'text-[#16865B]' : 'text-[#E31B23]'}`}>
                      {user.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 font-mono text-[11px] text-slate-400 tracking-wider bg-black/25 p-3 rounded-xl overflow-x-auto">
              <p className="truncate">{mrzLine1}</p>
              <p className="truncate">{mrzLine2}</p>
            </div>
          </div>
        )}

        {activeTab === 'AI_AVATAR' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVATAR_STYLE_ARCHETYPES.map(arch => (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => {
                    setSelectedArchetypeId(arch.id);
                    setGeneratedAvatarUrl(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                    selectedArchetypeId === arch.id ? 'border-[#4A90C6] bg-[#F3F7FB]' : 'border-[#E2EAF1] bg-white hover:bg-slate-50'
                  }`}
                >
                  <ProfileAvatar src={arch.assetUrl} name={arch.name} sizeClass="w-12 h-12 rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-[#263746] truncate">{arch.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{arch.lighting}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Sliders size={13} /> Studio Style Spec
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="text-xs font-semibold text-[#28658F] hover:underline flex items-center gap-1"
                >
                  {copiedPrompt ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1] font-mono text-[11px] text-[#263746]">
                {activePrompt}
              </div>
            </div>

            {isGenerating ? (
              <div className="p-6 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1] text-center space-y-3">
                <RefreshCw size={22} className="animate-spin text-[#263746] mx-auto" />
                <p className="text-sm font-semibold text-[#263746]">
                  {generationStep === 1 && `Preparing portrait parameters for ${user.name}...`}
                  {generationStep === 2 && `Applying ${selectedArchetype.name}...`}
                  {generationStep === 3 && 'Finalizing portrait...'}
                </p>
              </div>
            ) : generatedAvatarUrl ? (
              <div className="p-5 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1] space-y-4">
                <div className="flex items-center gap-4">
                  <ProfileAvatar src={generatedAvatarUrl} name={selectedArchetype.name} sizeClass="w-16 h-16 rounded-xl" />
                  <div>
                    <h4 className="font-bold text-sm text-[#263746]">{selectedArchetype.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{selectedArchetype.attire}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleApplyAvatar(generatedAvatarUrl)}
                    className="bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Check size={15} />
                    <span>Apply to Profile</span>
                  </button>
                  <a
                    href={generatedAvatarUrl}
                    download={`${user.username}-portrait.jpg`}
                    className="bg-white border border-[#E2EAF1] text-[#263746] font-semibold py-2.5 rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <Download size={15} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateAvatar}
                className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles size={16} />
                <span>Preview Studio Portrait</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'PHOTO_STUDIO' && (
          <div className="space-y-5">
            <div className="relative border-2 border-dashed border-slate-300 hover:border-[#4A90C6] rounded-xl p-6 transition-colors flex flex-col items-center justify-center space-y-2 cursor-pointer bg-[#F3F7FB]">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <div className="p-3 bg-white rounded-full border border-[#E2EAF1] text-[#263746]">
                <Upload size={22} />
              </div>
              <p className="text-xs font-semibold text-[#263746]">Upload replacement portrait photograph</p>
              <p className="text-[11px] text-slate-500">PNG, JPG, or WebP</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PASSPORT_PHOTO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyAvatar(preset.url)}
                  className={`p-2 rounded-xl border text-center transition-colors ${
                    user.passportUrl === preset.url ? 'border-[#4A90C6] bg-[#F3F7FB]' : 'border-[#E2EAF1] hover:bg-slate-50'
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-2">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <p className="text-xs font-semibold truncate text-[#263746]">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const UserManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: User) => void;
  initialUser?: User | null;
}> = ({ isOpen, onClose, onSubmit, initialUser }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    name: '',
    email: '',
    role: UserRole.PERSONAL,
    status: UserStatus.ACTIVE,
    balance: 0,
    idNumber: '',
    passportUrl: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialUser || {
          username: '',
          name: '',
          email: '',
          role: UserRole.PERSONAL,
          status: UserStatus.ACTIVE,
          balance: 0,
          idNumber: '',
          passportUrl: ''
        }
      );
    }
  }, [initialUser, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, passportUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: initialUser?.id || `usr-${Date.now()}`,
      username: formData.username!,
      name: formData.name!,
      role: formData.role || UserRole.PERSONAL,
      accountTypeLabel: formData.role === UserRole.BUSINESS ? 'Commercial Treasury' : 'Personal Banking',
      currency: 'USD',
      status: formData.status || UserStatus.ACTIVE,
      balance: formData.balance || 0,
      transactions: initialUser?.transactions || [],
      loans: initialUser?.loans || [],
      recurringPayments: initialUser?.recurringPayments || [],
      failedLoginAttempts: initialUser?.failedLoginAttempts || 0,
      email: formData.email || `${formData.username?.toLowerCase() || 'user'}@usdigital-bmu.com`,
      idNumber: formData.idNumber || `USB-${Math.floor(Math.random() * 899999 + 100000)}-P`,
      passportUrl: formData.passportUrl || '/src/assets/images/dolmat_bin_avatar_1791242922162.jpg',
      lockReason: formData.lockReason || initialUser?.lockReason,
      isDemoProfile: false,
      settings: initialUser?.settings || {
        hideBalance: false,
        analyticsFocus: 'GROWTH',
        transferLimit: 10000,
        biometricLogin: true
      }
    };
    onSubmit(newUser);
    onClose();
  };

  return (
    <Modal title={initialUser ? 'Edit Account Record' : 'Enroll Account'} isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1]">
          <ProfileAvatar src={formData.passportUrl} name={formData.name || 'User'} sizeClass="w-14 h-14" />
          <label className="cursor-pointer bg-white border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#263746] hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            <Upload size={14} />
            <span>Upload Photo</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Full Legal Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:border-[#4A90C6] outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Username</label>
            <input
              type="text"
              required
              value={formData.username || ''}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:border-[#4A90C6] outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:border-[#4A90C6] outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Account Role</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:border-[#4A90C6] outline-none text-sm"
            >
              <option value={UserRole.PERSONAL}>Personal Banking</option>
              <option value={UserRole.BUSINESS}>Business Banking</option>
              <option value={UserRole.ADMIN}>Administrator</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Balance (USD)</label>
          <input
            type="number"
            value={formData.balance ?? 0}
            onChange={e => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:border-[#4A90C6] outline-none text-sm tabular-nums"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <UserPlus size={17} />
          <span>{initialUser ? 'Save Account Record' : 'Create Account Record'}</span>
        </button>
      </form>
    </Modal>
  );
};

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdate: (settings: UserSettings) => void;
}> = ({ isOpen, onClose, settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleToggle = (key: keyof UserSettings) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Modal title="Security & Privacy Preferences" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleToggle('hideBalance')}
            className="w-full flex items-center justify-between p-4 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1] hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              {localSettings.hideBalance ? <EyeOff size={18} className="text-slate-500" /> : <Eye size={18} className="text-[#263746]" />}
              <div>
                <p className="text-sm font-semibold text-[#263746]">Balance Privacy Masking</p>
                <p className="text-xs text-slate-500">Conceal balances on dashboard overview</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${localSettings.hideBalance ? 'bg-[#367EAF]' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.hideBalance ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleToggle('biometricLogin')}
            className="w-full flex items-center justify-between p-4 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1] hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <Fingerprint size={18} className={localSettings.biometricLogin ? 'text-[#16865B]' : 'text-slate-500'} />
              <div>
                <p className="text-sm font-semibold text-[#263746]">Face ID Sign-In</p>
                <p className="text-xs text-slate-500">Allow biometric camera sign-in flow</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${localSettings.biometricLogin ? 'bg-[#16865B]' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.biometricLogin ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 block">Overview Analytics Focus</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLocalSettings({ ...localSettings, analyticsFocus: 'GROWTH' })}
              className={`p-3 rounded-xl border text-left transition-colors ${
                localSettings.analyticsFocus === 'GROWTH'
                  ? 'bg-[#367EAF] text-white border-[#4A90C6]'
                  : 'bg-[#F3F7FB] border-[#E2EAF1] text-[#263746]'
              }`}
            >
              <TrendingUp size={16} className="mb-1" />
              <p className="text-xs font-semibold">Balance Trend</p>
            </button>
            <button
              type="button"
              onClick={() => setLocalSettings({ ...localSettings, analyticsFocus: 'SPENDING' })}
              className={`p-3 rounded-xl border text-left transition-colors ${
                localSettings.analyticsFocus === 'SPENDING'
                  ? 'bg-[#367EAF] text-white border-[#4A90C6]'
                  : 'bg-[#F3F7FB] border-[#E2EAF1] text-[#263746]'
              }`}
            >
              <PieChart size={16} className="mb-1" />
              <p className="text-xs font-semibold">Category Activity</p>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onUpdate(localSettings);
            onClose();
          }}
          className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <ShieldCheck size={17} />
          <span>Save Preferences</span>
        </button>
      </div>
    </Modal>
  );
};

export const TransactionDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}> = ({ isOpen, onClose, transaction }) => {
  if (!transaction) return null;

  return (
    <Modal title="Transaction Details" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-center p-5 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1]">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Amount ({transaction.currency || 'USD'})</p>
          <p
            className={`text-3xl font-display font-bold tabular-nums ${
              transaction.type === 'CREDIT' ? 'text-[#16865B]' : 'text-[#263746]'
            }`}
          >
            {transaction.type === 'CREDIT' ? '+' : '-'}$
            {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {transaction.currency || 'USD'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2EAF1] divide-y divide-slate-200 text-xs">
          <div className="flex justify-between items-center p-3.5">
            <span className="text-slate-500">Description</span>
            <span className="text-[#263746] font-semibold text-right">{transaction.description}</span>
          </div>
          <div className="flex justify-between items-center p-3.5">
            <span className="text-slate-500">Transaction Type</span>
            <span className="text-[#263746] font-medium">{transaction.transactionTypeLabel || transaction.category}</span>
          </div>
          <div className="flex justify-between items-center p-3.5">
            <span className="text-slate-500">Category</span>
            <span className="text-[#263746] font-medium">{transaction.category}</span>
          </div>
          <div className="flex justify-between items-center p-3.5">
            <span className="text-slate-500">Date</span>
            <span className="text-[#263746] font-mono tabular-nums">{transaction.displayDate || transaction.date}</span>
          </div>
          {transaction.sampleSenderLabel && (
            <div className="flex justify-between items-center p-3.5">
              <span className="text-slate-500">Sender</span>
              <span className="text-[#263746] font-medium">{transaction.sampleSenderLabel}</span>
            </div>
          )}
          <div className="flex justify-between items-center p-3.5">
            <span className="text-slate-500">Status</span>
            <span className="text-[#16865B] font-semibold">{transaction.status || 'Settled'}</span>
          </div>
          <div className="flex justify-between items-center p-3.5">
            <span className="text-slate-500">Reference</span>
            <span className="text-slate-600 font-mono">{transaction.reference || transaction.id}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          <ExternalLink size={16} />
          <span>Print Statement View</span>
        </button>
      </div>
    </Modal>
  );
};

export const RecurringPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<RecurringPayment, 'id' | 'occurences' | 'status' | 'nextDate'>) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [duration, setDuration] = useState('12');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description: desc,
      amount: parseFloat(amount),
      frequency: freq,
      duration: parseInt(duration)
    });
    onClose();
    setDesc('');
    setAmount('');
    setFreq('MONTHLY');
    setDuration('12');
  };

  return (
    <Modal title="Schedule Standing Instruction" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Payee / Description</label>
          <input
            type="text"
            required
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:border-[#4A90C6] outline-none text-sm"
            placeholder="e.g. Monthly Utility Payment"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Amount (USD)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:border-[#4A90C6] outline-none text-sm tabular-nums"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Frequency</label>
            <select
              value={freq}
              onChange={e => setFreq(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:border-[#4A90C6] outline-none text-sm"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Number of Cycles</label>
          <input
            type="number"
            required
            min="1"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:border-[#4A90C6] outline-none text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Calendar size={17} />
          <span>Schedule Payment</span>
        </button>
      </form>
    </Modal>
  );
};

export const PremiumUpgradeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal title="Transfer Submitted" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5 text-center">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
          <Check size={28} className="text-[#16865B]" />
        </div>
        <div>
          <h4 className="text-lg font-display font-bold text-[#263746]">Instruction Recorded</h4>
          <p className="text-slate-600 text-sm mt-1">
            Your transfer instruction has been recorded in the account ledger.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export const QUICK_CONTACTS = [
  { name: 'Samir H.', handle: '@samir.h', avatar: '/src/assets/images/dolmat_bin_avatar_1791242922162.jpg' },
  { name: 'Elena M.', handle: '@elena.m', avatar: '/src/assets/images/sarah_lee_avatar_1791242931296.jpg' },
  { name: 'Marcus R.', handle: '@marcus.r', avatar: '/src/assets/images/sovereign_avatar_1791242949331.jpg' }
];

export const TransferModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (data: { to: string; amount: number; description: string }) => void;
  initialRecipient?: { name: string; avatar?: string } | null;
}> = ({ isOpen, onClose, onTransfer, initialRecipient }) => {
  const [selectedRecipient, setSelectedRecipient] = useState<string>(QUICK_CONTACTS[0].name);
  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [amountStr, setAmountStr] = useState<string>('150');
  const [desc, setDesc] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialRecipient?.name) {
        setSelectedRecipient(initialRecipient.name);
        setIsCustomMode(false);
        setCustomRecipient('');
      } else {
        setSelectedRecipient(QUICK_CONTACTS[0].name);
        setIsCustomMode(false);
      }
      setAmountStr('150');
      setDesc('');
    }
  }, [isOpen, initialRecipient]);

  const handleDigit = (d: string) => {
    setAmountStr(prev => {
      if (d === '.' && prev.includes('.')) return prev;
      if (prev === '0' && d !== '.') return d;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      if (prev.length >= 10) return prev;
      return prev + d;
    });
  };

  const handleBackspace = () => {
    setAmountStr(prev => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const numericAmount = parseFloat(amountStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = isCustomMode ? customRecipient.trim() : selectedRecipient;
    if (!target || numericAmount <= 0) return;
    onTransfer({ to: target, amount: numericAmount, description: desc });
    onClose();
  };

  return (
    <Modal title="Send Money (USD)" isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-center gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${
                isCustomMode ? 'bg-[#367EAF] text-white border-[#4A90C6]' : 'bg-white text-[#263746] border-slate-300'
              }`}
            >
              <Plus size={18} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">New</span>
          </button>

          {QUICK_CONTACTS.map(person => {
            const active = !isCustomMode && selectedRecipient === person.name;
            return (
              <button
                key={person.name}
                type="button"
                onClick={() => {
                  setIsCustomMode(false);
                  setSelectedRecipient(person.name);
                }}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <ProfileAvatar
                  src={person.avatar}
                  name={person.name}
                  sizeClass="w-11 h-11"
                  className={active ? 'border-2 border-[#E31B23]' : 'border border-[#E2EAF1]'}
                />
                <span className={`text-[11px] font-medium ${active ? 'text-[#263746] font-bold' : 'text-slate-600'}`}>
                  {person.name}
                </span>
              </button>
            );
          })}
        </div>

        {isCustomMode && (
          <input
            type="text"
            required
            value={customRecipient}
            onChange={e => setCustomRecipient(e.target.value)}
            placeholder="Recipient full name or account"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-[#4A90C6] outline-none"
          />
        )}

        <div className="text-center py-2 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1]">
          <p className="text-3xl font-display font-bold text-[#263746] tabular-nums">
            ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-mono text-slate-500">USD</p>
        </div>

        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Optional payment reference"
          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:border-[#4A90C6] outline-none"
        />

        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => handleDigit(key)}
              className="h-11 rounded-xl bg-[#F3F7FB] hover:bg-slate-200 text-[#263746] font-display font-bold text-base transition-colors"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-11 rounded-xl bg-[#F3F7FB] hover:bg-slate-200 text-[#263746] flex items-center justify-center transition-colors"
            aria-label="Backspace"
          >
            <Delete size={18} />
          </button>
        </div>

        <button
          type="submit"
          disabled={numericAmount <= 0 || (isCustomMode && !customRecipient.trim())}
          className="w-full bg-[#367EAF] hover:bg-[#28658F] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <span>Send ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <ArrowRightCircle size={17} />
        </button>
      </form>
    </Modal>
  );
};

export const LoanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; term: number }) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('50000');
  const [term, setTerm] = useState('24');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ amount: parseFloat(amount), term: parseInt(term) });
    onClose();
  };

  return (
    <Modal title="Credit Facility Inquiry" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Requested Amount (USD)</label>
          <input
            type="number"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:border-[#4A90C6] outline-none text-sm tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Term (Months)</label>
          <select
            value={term}
            onChange={e => setTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:border-[#4A90C6] outline-none text-sm"
          >
            <option value="12">12 Months</option>
            <option value="24">24 Months</option>
            <option value="48">48 Months</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Submit Inquiry
        </button>
      </form>
    </Modal>
  );
};
