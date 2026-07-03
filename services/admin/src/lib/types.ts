// Seat Types
export interface Seat {
  id: string
  row: string
  number: number
  type: "standard" | "vip" | "couple"
  isAvailable: boolean
  price?: number
}

// Showtime Types
export interface Showtime {
  id: string
  movieId: string
  roomId: string
  cinemaId: string
  time: string
  format: string
  price: number
  duration: number
}

// Combo Types
export interface ComboItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  items?: any[]
  quantity?: number
  deleted?: boolean
}

// Movie Types
export interface MovieDisplay {
  id: string
  title: string
  description: string
  duration: number
  director?: string
  cast?: string
  posterUrl?: string
  trailerUrl?: string
  releaseDate?: string
  status?: string
}
