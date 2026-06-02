import client from './client'
import type { Game, GameListItem, GameSkin } from '../types/game'

export async function listMyGames(): Promise<GameListItem[]> {
  const res = await client.get('/games')
  return res.data
}

export async function listPublicGames(): Promise<GameListItem[]> {
  const res = await client.get('/games/public')
  return res.data
}

export async function getGame(id: number): Promise<Game> {
  const res = await client.get(`/games/${id}`)
  return res.data
}

export async function createGame(data: {
  title: string
  description?: string
  module_type: string
  params_json?: string
  skin_id?: number | null
  punishment_type?: string
  punishment_config?: string
}): Promise<Game> {
  const res = await client.post('/games', data)
  return res.data
}

export async function updateGame(id: number, data: Record<string, any>): Promise<Game> {
  const res = await client.put(`/games/${id}`, data)
  return res.data
}

export async function deleteGame(id: number): Promise<void> {
  await client.delete(`/games/${id}`)
}

export async function publishGame(id: number): Promise<Game> {
  const res = await client.post(`/games/${id}/publish`)
  return res.data
}

export async function listSkins(): Promise<GameSkin[]> {
  const res = await client.get('/skins')
  return res.data
}
