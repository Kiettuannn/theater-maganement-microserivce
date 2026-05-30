export interface Movie {
  id: string;
  title: string;
  genre: string[];
  rating: number;
  duration: number;
  releaseDate: string;
  image: string;
  description: string;
  status: 'now-showing' | 'coming-soon';
}

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  time: string;
  availableSeats: number;
  price: number;
  date: string;
}

export interface Cinema {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  status: 'available' | 'booked' | 'selected';
  price: number;
}

export interface Booking {
  id: string;
  movieId: string;
  showtimeId: string;
  cinemaId: string;
  seats: string[];
  totalPrice: number;
  bookingDate: string;
  status: 'confirmed' | 'cancelled';
}

const movies: Movie[] = [
  {
    id: '1',
    title: 'The Dark Knight',
    genre: ['Action', 'Crime', 'Drama'],
    rating: 9,
    duration: 152,
    releaseDate: '2024-01-15',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&h=750&fit=crop',
    description: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.',
    status: 'now-showing',
  },
  {
    id: '2',
    title: 'Inception',
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    rating: 8.8,
    duration: 148,
    releaseDate: '2024-02-10',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=750&fit=crop',
    description: 'A skilled thief who steals corporate secrets through the use of dream-sharing technology.',
    status: 'now-showing',
  },
  {
    id: '3',
    title: 'Interstellar',
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    rating: 8.6,
    duration: 169,
    releaseDate: '2024-03-20',
    image: 'https://images.unsplash.com/photo-1489599810694-b5c4616db033?w=500&h=750&fit=crop',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
    status: 'now-showing',
  },
  {
    id: '4',
    title: 'Avengers: Endgame',
    genre: ['Action', 'Adventure', 'Drama'],
    rating: 8.4,
    duration: 181,
    releaseDate: '2024-04-15',
    image: 'https://images.unsplash.com/photo-1616530940355-af821df814fe?w=500&h=750&fit=crop',
    description: 'After the devastating events, the Avengers assemble once more to reverse Thanos\' actions.',
    status: 'now-showing',
  },
  {
    id: '5',
    title: 'Dune: Part Two',
    genre: ['Action', 'Adventure', 'Drama'],
    rating: 8,
    duration: 166,
    releaseDate: '2024-06-01',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c6ed2963c?w=500&h=750&fit=crop',
    description: 'Paul Atreides travels to the dangerous planet Dune to ensure the future of his family and people.',
    status: 'coming-soon',
  },
  {
    id: '6',
    title: 'Oppenheimer',
    genre: ['Biography', 'Drama', 'History'],
    rating: 8.5,
    duration: 180,
    releaseDate: '2024-07-10',
    image: 'https://images.unsplash.com/photo-1533613220915-609f4a6b0d0b?w=500&h=750&fit=crop',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    status: 'coming-soon',
  },
];

const cinemas: Cinema[] = [
  {
    id: 'c1',
    name: 'Galaxy Cinema - Center',
    city: 'Ho Chi Minh',
    address: '123 Nguyen Hue Boulevard, District 1',
  },
  {
    id: 'c2',
    name: 'Lotte Cinema - Diamond',
    city: 'Ho Chi Minh',
    address: '456 Le Thanh Ton Street, District 1',
  },
  {
    id: 'c3',
    name: 'Cineplex - Sunrise',
    city: 'Hanoi',
    address: '789 Trang Tien Street, Hoan Kiem',
  },
  {
    id: 'c4',
    name: 'BHD Star - Vincom',
    city: 'Da Nang',
    address: '321 Nguyen Van Linh Street, Son Tra',
  },
];

const showtimes: Showtime[] = [
  {
    id: 's1',
    movieId: '1',
    cinemaId: 'c1',
    time: '10:00',
    availableSeats: 50,
    price: 120000,
    date: '2024-05-30',
  },
  {
    id: 's2',
    movieId: '1',
    cinemaId: 'c1',
    time: '13:30',
    availableSeats: 45,
    price: 120000,
    date: '2024-05-30',
  },
  {
    id: 's3',
    movieId: '1',
    cinemaId: 'c1',
    time: '16:00',
    availableSeats: 60,
    price: 150000,
    date: '2024-05-30',
  },
  {
    id: 's4',
    movieId: '1',
    cinemaId: 'c1',
    time: '19:00',
    availableSeats: 30,
    price: 150000,
    date: '2024-05-30',
  },
  {
    id: 's5',
    movieId: '1',
    cinemaId: 'c1',
    time: '21:30',
    availableSeats: 25,
    price: 150000,
    date: '2024-05-30',
  },
  {
    id: 's6',
    movieId: '2',
    cinemaId: 'c1',
    time: '10:00',
    availableSeats: 40,
    price: 120000,
    date: '2024-05-30',
  },
  {
    id: 's7',
    movieId: '2',
    cinemaId: 'c1',
    time: '14:00',
    availableSeats: 35,
    price: 120000,
    date: '2024-05-30',
  },
  {
    id: 's8',
    movieId: '1',
    cinemaId: 'c1',
    time: '11:00',
    availableSeats: 48,
    price: 120000,
    date: '2024-05-31',
  },
  {
    id: 's9',
    movieId: '1',
    cinemaId: 'c1',
    time: '14:30',
    availableSeats: 52,
    price: 120000,
    date: '2024-06-01',
  },
  {
    id: 's10',
    movieId: '1',
    cinemaId: 'c2',
    time: '17:30',
    availableSeats: 45,
    price: 150000,
    date: '2024-06-02',
  },
  {
    id: 's11',
    movieId: '1',
    cinemaId: 'c2',
    time: '20:00',
    availableSeats: 40,
    price: 150000,
    date: '2024-06-03',
  },
  {
    id: 's12',
    movieId: '1',
    cinemaId: 'c3',
    time: '12:00',
    availableSeats: 60,
    price: 120000,
    date: '2024-06-04',
  },
  {
    id: 's13',
    movieId: '1',
    cinemaId: 'c3',
    time: '18:30',
    availableSeats: 34,
    price: 150000,
    date: '2024-06-05',
  },
  {
    id: 's14',
    movieId: '2',
    cinemaId: 'c1',
    time: '11:30',
    availableSeats: 36,
    price: 120000,
    date: '2024-05-31',
  },
  {
    id: 's15',
    movieId: '2',
    cinemaId: 'c1',
    time: '15:00',
    availableSeats: 42,
    price: 120000,
    date: '2024-06-01',
  },
  {
    id: 's16',
    movieId: '2',
    cinemaId: 'c2',
    time: '18:00',
    availableSeats: 38,
    price: 130000,
    date: '2024-06-02',
  },
  {
    id: 's17',
    movieId: '2',
    cinemaId: 'c2',
    time: '20:30',
    availableSeats: 28,
    price: 130000,
    date: '2024-06-03',
  },
  {
    id: 's18',
    movieId: '2',
    cinemaId: 'c3',
    time: '13:00',
    availableSeats: 50,
    price: 120000,
    date: '2024-06-04',
  },
  {
    id: 's19',
    movieId: '2',
    cinemaId: 'c3',
    time: '16:30',
    availableSeats: 44,
    price: 120000,
    date: '2024-06-05',
  },
  {
    id: 's20',
    movieId: '3',
    cinemaId: 'c1',
    time: '12:30',
    availableSeats: 46,
    price: 125000,
    date: '2024-05-31',
  },
  {
    id: 's21',
    movieId: '3',
    cinemaId: 'c1',
    time: '16:00',
    availableSeats: 40,
    price: 125000,
    date: '2024-06-01',
  },
  {
    id: 's22',
    movieId: '3',
    cinemaId: 'c2',
    time: '19:00',
    availableSeats: 35,
    price: 135000,
    date: '2024-06-02',
  },
  {
    id: 's23',
    movieId: '3',
    cinemaId: 'c2',
    time: '21:15',
    availableSeats: 30,
    price: 135000,
    date: '2024-06-03',
  },
  {
    id: 's24',
    movieId: '3',
    cinemaId: 'c4',
    time: '14:00',
    availableSeats: 55,
    price: 125000,
    date: '2024-06-04',
  },
  {
    id: 's25',
    movieId: '3',
    cinemaId: 'c4',
    time: '17:45',
    availableSeats: 50,
    price: 125000,
    date: '2024-06-05',
  },
  {
    id: 's26',
    movieId: '4',
    cinemaId: 'c1',
    time: '10:30',
    availableSeats: 50,
    price: 140000,
    date: '2024-05-31',
  },
  {
    id: 's27',
    movieId: '4',
    cinemaId: 'c1',
    time: '13:30',
    availableSeats: 47,
    price: 140000,
    date: '2024-06-01',
  },
  {
    id: 's28',
    movieId: '4',
    cinemaId: 'c2',
    time: '17:00',
    availableSeats: 32,
    price: 150000,
    date: '2024-06-02',
  },
  {
    id: 's29',
    movieId: '4',
    cinemaId: 'c2',
    time: '19:45',
    availableSeats: 26,
    price: 150000,
    date: '2024-06-03',
  },
  {
    id: 's30',
    movieId: '4',
    cinemaId: 'c3',
    time: '12:15',
    availableSeats: 58,
    price: 140000,
    date: '2024-06-04',
  },
  {
    id: 's31',
    movieId: '4',
    cinemaId: 'c3',
    time: '18:15',
    availableSeats: 41,
    price: 140000,
    date: '2024-06-05',
  },
];

export const mockData = {
  movies,
  cinemas,
  showtimes,
};

export const getNowShowingMovies = () => movies.filter(m => m.status === 'now-showing');
export const getComingSoonMovies = () => movies.filter(m => m.status === 'coming-soon');
export const getMovieById = (id: string) => movies.find(m => m.id === id);
export const getShowtimesByMovieId = (movieId: string) => showtimes.filter(s => s.movieId === movieId);
export const getCinemaById = (id: string) => cinemas.find(c => c.id === id);
