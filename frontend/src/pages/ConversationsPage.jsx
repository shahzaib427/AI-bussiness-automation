import { useCallback, useEffect, useState } from 'react'
import { MessageSquare, AlertCircle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import { getConversations } from '../services/api'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getConversations({ page, limit })
      setConversations(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load conversations.')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Conversations</h1>
        <p className="text-sm text-slate-500">
          Every message sent to the AI Agent and its real response.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <Loader label="Loading conversations..." />
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Run an automation from the Automation tab and the AI Agent's response will show up here."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <div key={conv.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span>Session: {conv.session_id.slice(0, 8)}...</span>
                <span>{new Date(conv.created_at).toLocaleString()}</span>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 flex-shrink-0">
                    You
                  </div>
                  <p className="text-sm text-slate-800 bg-slate-50 rounded-xl rounded-tl-none px-3 py-2 flex-1">
                    {conv.message}
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700 flex-shrink-0">
                    AI
                  </div>
                  <p className="text-sm text-slate-800 bg-brand-50 rounded-xl rounded-tl-none px-3 py-2 flex-1 whitespace-pre-wrap">
                    {conv.response || 'No response recorded.'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-slate-200 px-4">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </AppLayout>
  )
}
