'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Badge, getStatusVariant, getInterpretationVariant, getPriorityVariant } from '@/components/ui/Badge'
import { Plus, FlaskConical } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function LabsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'resulted'>('pending')
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [resultedOrders, setResultedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      setLoading(true)
      const [{ data: pending }, { data: resulted }] = await Promise.all([
        supabase.from('lab_orders')
          .select('*, patient:patients(id, first_name, last_name, mrn), provider:profiles!ordered_by(full_name)')
          .in('status', ['ordered', 'collected', 'processing'])
          .order('ordered_at', { ascending: false })
          .limit(30),
        supabase.from('lab_orders')
          .select('*, patient:patients(id, first_name, last_name, mrn), provider:profiles!ordered_by(full_name), lab_results(*)')
          .eq('status', 'resulted')
          .order('resulted_at', { ascending: false })
          .limit(30),
      ])
      setPendingOrders(pending || [])
      setResultedOrders(resulted || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const tabCount = {
    pending: pendingOrders.length,
    resulted: resultedOrders.length,
  }

  const currentData = activeTab === 'pending' ? pendingOrders : resultedOrders

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
          <p className="text-gray-500 text-sm">Laboratory order management</p>
        </div>
        <Link
          href="/labs/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Lab Order
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending
            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {tabCount.pending}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('resulted')}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'resulted'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Resulted
            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${activeTab === 'resulted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {tabCount.resulted}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Test</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordered By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordered</th>
                  {activeTab === 'resulted' && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Range</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Interpretation</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.length > 0 ? (
                  currentData.map((order: any) => {
                    const result = order.lab_results?.[0]
                    const isCritical = result?.interpretation === 'critical_high' || result?.interpretation === 'critical_low'
                    return (
                      <tr key={order.id} className={`hover:bg-blue-50/30 transition-colors ${isCritical ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <Badge variant={getPriorityVariant(order.priority)}>
                            {order.priority.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/patients/${order.patient_id}/labs`} className="font-medium text-gray-900 hover:text-blue-700 block">
                            {order.patient?.last_name}, {order.patient?.first_name}
                          </Link>
                          <span className="text-xs font-mono text-gray-400">{order.patient?.mrn}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{order.test_name}</p>
                          {order.test_code && <p className="text-xs font-mono text-gray-400">{order.test_code}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">Dr. {order.provider?.full_name}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(order.ordered_at)}</td>
                        {activeTab === 'resulted' && (
                          <>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${isCritical ? 'text-red-600' : result?.interpretation === 'abnormal' ? 'text-orange-600' : 'text-gray-800'}`}>
                                {result?.result_value ?? '—'} {result?.unit && <span className="text-xs font-normal text-gray-500">{result.unit}</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{result?.reference_range || '—'}</td>
                            <td className="px-4 py-3">
                              {result ? (
                                <Badge variant={getInterpretationVariant(result.interpretation)}>
                                  {result.interpretation.replace('_', ' ')}
                                </Badge>
                              ) : '—'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(order.status)}>{order.status.replace('_', ' ')}</Badge>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={activeTab === 'resulted' ? 9 : 6} className="px-4 py-8 text-center text-gray-400">
                      <FlaskConical className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No {activeTab} lab orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
