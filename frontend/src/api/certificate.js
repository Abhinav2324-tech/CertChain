import client, { API_BASE_URL } from './client'

export const issueCertificate = async (payload) => {
  const { data } = await client.post('/certificate/issue', payload)
  return data
}

export const revokeCertificate = async (certificateId) => {
  const { data } = await client.put(`/certificate/revoke/${certificateId}`)
  return data
}

export const tamperCertificate = async (certificateId) => {
  const { data } = await client.post(`/certificate/tamper/${certificateId}`)
  return data
}

export const tamperEditCertificate = async (certificateId, subjects) => {
  const { data } = await client.post(`/certificate/tamper-edit/${certificateId}`, { subjects })
  return data
}

export const updateCertificate = async (certificateId, payload) => {
  const { data } = await client.put(`/certificate/update/${certificateId}`, payload)
  return data
}

export const verifyCertificate = async (certificateId) => {
  const { data } = await client.get(`/certificate/verify/${certificateId}`)
  return data
}

export const verifyCertificateFile = async (certificateId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await client.post(`/certificate/verify-file/${certificateId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const getAuditLogs = async (certificateId) => {
  const { data } = await client.get(`/certificate/audit/${certificateId}`)
  return data
}

export const getCertificateDetails = async (certificateId) => {
  const { data } = await client.get(`/certificate/details/${certificateId}`)
  return data
}

export const getDownloadUrl = (certificateId) =>
  `${API_BASE_URL}/certificate/download/${certificateId}`
