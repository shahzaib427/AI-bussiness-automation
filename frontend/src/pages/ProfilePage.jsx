import { useState } from 'react'
import { User, Loader2 } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ProfilePage() {
  const { user, updateName } = useAuth()
  const { showToast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Name cannot be empty.')
      return
    }
    setIsSaving(true)
    try {
      await updateName(name.trim())
      showToast('Profile updated.', 'success')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
      showToast('Failed to update profile.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your account details.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center">
            <User className="h-7 w-7 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b border-slate-200">
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="text-slate-900 font-medium capitalize">{user?.role}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Member since</dt>
            <dd className="text-slate-900 font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-500 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
