import client from './client'

export const loginUniversity = async (payload) => {
  const { data } = await client.post('/university/login', payload)
  return data
}

export const registerUniversity = async (payload) => {
  const { data } = await client.post('/university/register', payload)
  return data
}
