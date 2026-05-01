import apiClient from './client'

export interface TriageResult {
  specialty: string
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency'
  urgency_explanation: string
  reasoning: string
  emergency_message: string | null
}

export const triageApi = {
  assess: async (symptoms: string): Promise<TriageResult> => {
    const response = await apiClient.post<TriageResult>('/triage/', {
      symptoms,
    })
    return response.data
  },
}