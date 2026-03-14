import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patients/PatientHeader'
import { PatientTabs } from '@/components/patients/PatientTabs'
import { Badge, getStatusVariant } from '@/components/ui/Badge'
import { FileText, CheckCircle } from 'lucide-react'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const noteTypeColors: Record<string, string> = {
  progress: 'bg-blue-50 text-blue-700 border-blue-200',
  admission: 'bg-green-50 text-green-700 border-green-200',
  discharge: 'bg-purple-50 text-purple-700 border-purple-200',
  procedure: 'bg-orange-50 text-orange-700 border-orange-200',
  nursing: 'bg-teal-50 text-teal-700 border-teal-200',
  consultation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  soap: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export default async function PatientNotesPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [{ data: patient }, { data: allergies }, { data: notes }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase.from('allergies').select('*').eq('patient_id', id).eq('status', 'active'),
    supabase.from('clinical_notes')
      .select('*, author:profiles!author_id(full_name, role)')
      .eq('patient_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!patient) notFound()

  return (
    <div className="space-y-4">
      <PatientHeader patient={patient} allergies={allergies || []} />
      <PatientTabs patientId={id} />

      <div className="space-y-4">
        {notes && notes.length > 0 ? (
          notes.map((note: any) => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${noteTypeColors[note.note_type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {note.note_type.replace('_', ' ')}
                    </span>
                    <h3 className="font-semibold text-gray-900">{note.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    By {note.author?.full_name} ({note.author?.role?.replace('_', ' ')})
                    &middot; {formatDateTime(note.created_at)}
                    {note.signed_at && ` · Signed: ${formatDateTime(note.signed_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {note.status === 'signed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  <Badge variant={getStatusVariant(note.status)}>{note.status}</Badge>
                </div>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-12 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No clinical notes on file</p>
          </div>
        )}
      </div>
    </div>
  )
}
