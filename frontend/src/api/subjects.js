import client from './client'

export const getSubjectsBySemester = async (semester) => {
  const { data } = await client.get(`/subjects/${semester}`)
  return data
}
