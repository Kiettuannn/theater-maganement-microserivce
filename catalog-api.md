# Catalog Service API

> **Base URL:** `http://localhost:8082/catalog`
> **Content-Type:** `application/json`

---

## Movies — `/movies`

### `POST /movies` — Tạo phim mới
```json
{
  "title": "Avengers: Endgame",
  "slug": "avengers-endgame",
  "description": "Mo ta phim...",
  "durationMinutes": 181,
  "releaseDate": "2019-04-26",
  "status": "NOW_SHOWING",
  "ageRatingId": "<ageRatingId>",
  "genreIds": ["<genreId1>"],
  "posterUrl": "https://example.com/poster.jpg",
  "trailerUrl": "https://youtube.com/watch?v=xxx",
  "director": "Anthony Russo",
  "cast": "Robert Downey Jr."
}
```
### `GET /movies` — Lay tat ca phim
### `GET /movies/{id}` — Lay chi tiet phim theo ID
### `GET /movies/slug/{slug}` — Lay phim theo slug
### `GET /movies/status/{status}` — Loc phim theo trang thai (NOW_SHOWING | COMING_SOON | ENDED | ARCHIVED)
### `GET /movies/now-showing` — Phim dang chieu
### `GET /movies/coming-soon` — Phim sap chieu
### `GET /movies/search?title={title}` — Tim phim theo ten
### `GET /movies/genre/{genreId}` — Lay phim theo the loai
### `PUT /movies/{id}` — Cap nhat thong tin phim (body giong POST)
### `PATCH /movies/{id}/archive` — Luu tru phim (status ARCHIVED)
### `DELETE /movies/{id}` — Xoa phim

---

## Genres — `/genres`

### `POST /genres` — Tao the loai phim
```json
{ "name": "Action" }
```
### `GET /genres` — Lay tat ca the loai
### `GET /genres/{id}` — Lay the loai theo ID
### `GET /genres/name/{name}` — Lay the loai theo ten

---

## Age Ratings — `/age-ratings`

### `POST /age-ratings` — Tao nhan phan loai tuoi
```json
{
  "code": "T13",
  "description": "Phim danh cho khan gia tu 13 tuoi tro len"
}
```
### `GET /age-ratings` — Lay tat ca nhan phan loai
### `GET /age-ratings/{id}` — Lay nhan theo ID

---

## Rooms — `/rooms`

### `POST /rooms` — Tao phong chieu
```json
{
  "name": "Phong Chieu 1",
  "totalSeats": 50,
  "screenType": "2D"
}
```
### `GET /rooms` — Lay tat ca phong chieu
### `GET /rooms/{roomId}` — Lay chi tiet phong chieu
### `PUT /rooms/{roomId}` — Cap nhat phong chieu
```json
{
  "name": "Phong Chieu 1 (Updated)",
  "totalSeats": 60,
  "screenType": "3D"
}
```
### `DELETE /rooms/{roomId}` — Xoa phong chieu

---

## Seat Types — `/seat-types`

### `POST /seat-types` — Tao loai ghe
```json
{ "name": "Standard", "description": "Ghe thuong" }
```
### `GET /seat-types` — Lay tat ca loai ghe
### `GET /seat-types/{id}` — Lay loai ghe theo ID

---

## Price Config — `/price-configs`

### `POST /price-configs` — Tao cau hinh gia cho loai ghe trong phong
```json
{
  "roomId": "<roomId>",
  "seatTypeId": "<seatTypeId>",
  "price": 75000
}
```
### `GET /price-configs` — Lay tat ca cau hinh gia
### `GET /price-configs/{id}` — Lay cau hinh gia theo ID
### `PUT /price-configs/{id}` — Cap nhat gia
```json
{ "price": 90000 }
```
### `DELETE /price-configs/{id}` — Xoa cau hinh gia

---

## Showtimes — `/showtimes`

### `POST /showtimes` — Tao suat chieu
```json
{
  "movieId": "<movieId>",
  "roomId": "<roomId>",
  "startTime": "2026-07-02T14:00:00",
  "endTime": "2026-07-02T17:00:00"
}
```
> Khong duoc overlap voi suat chieu cung phong. startTime phai trong tuong lai.

### `GET /showtimes` — Lay tat ca suat chieu
### `GET /showtimes/{showtimeId}` — Lay suat chieu theo ID
### `GET /showtimes/{showtimeId}/detail` — Lay chi tiet suat chieu (kem phong, phim)
### `GET /showtimes/movie/{movieId}` — Lay suat chieu theo phim
### `GET /showtimes/room/{roomId}` — Lay suat chieu theo phong
### `PUT /showtimes/{showtimeId}` — Cap nhat thoi gian chieu
```json
{
  "startTime": "2026-07-02T15:00:00",
  "endTime": "2026-07-02T18:00:00"
}
```
### `DELETE /showtimes/{showtimeId}` — Xoa suat chieu

---

## Combos — `/combos`

### `POST /combos` — Tao combo bap nuoc
```json
{
  "name": "Combo Doi",
  "description": "2 nuoc lon + 2 bap",
  "price": 120000,
  "imageUrl": "https://example.com/combo.jpg",
  "isActive": true
}
```
### `GET /combos` — Lay tat ca combo
### `GET /combos/{comboId}` — Lay combo theo ID
### `PUT /combos/{comboId}` — Cap nhat combo
```json
{
  "name": "Combo Doi (Updated)",
  "description": "2 nuoc lon + 2 bap + 1 snack",
  "price": 135000,
  "isActive": true
}
```
### `DELETE /combos/{comboId}` — Xoa combo
