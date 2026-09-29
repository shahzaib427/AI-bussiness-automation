import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Shield, Sparkles, Settings as SettingsIcon } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'automation', label: 'Automation', icon: Sparkles },
  { id: 'application', label: 'Application', icon: SettingsIcon },
]

function ComingSoon({ label }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
        Coming soon
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('account')

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <nav className="sm:col-span-1 flex sm:flex-col gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="sm:col-span-3 bg-white rounded-2xl border border-slate-200 p-6">
          {activeTab === 'account' && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Account</h2>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="text-sm text-slate-700">Name &amp; profile details</p>
                  <p className="text-xs text-slate-400">Update your name from the Profile page.</p>
                </div>
                <Link to="/profile" className="text-sm font-medium text-brand-600 hover:underline">
                  Go to Profile
                </Link>
              </div>
              <ComingSoon label="Change email address" />
              <ComingSoon label="Delete account" />
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Security</h2>
              <ComingSoon label="Change password" />
              <ComingSoon label="Two-factor authentication" />
              <ComingSoon label="Active sessions" />
              <div className="pt-3 text-xs text-slate-400">
                Your account currently authenticates via a JWT issued at login
                {user?.role === 'admin' ? ' with admin privileges.' : '.'}
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Automation</h2>
              <ComingSoon label="Custom n8n webhook per workflow" />
              <ComingSoon label="Automation retry policy" />
              <ComingSoon label="Notification preferences for failed runs" />
            </div>
          )}

          {activeTab === 'application' && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Application</h2>
              <ComingSoon label="Theme (light / dark)" />
              <ComingSoon label="Default dashboard view" />
              <ComingSoon label="Export data" />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
