import client from './client'

export const loginStudent = async (payload) => {
  const { data } = await client.post('/student/login', payload)
  return data
}

export const registerStudent = async (payload) => {
  const { data } = await client.post('/student/register', payload)
  return data
}

export const getStudentCertificates = async (studentId) => {
  const { data } = await client.get(`/student/certificates/${studentId}`)
  return data
}

export const getStudentByRoll = async (rollNumber) => {
  const { data } = await client.get(`/student/by-roll/${encodeURIComponent(rollNumber)}`)
  return data
}
