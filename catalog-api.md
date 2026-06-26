# Catalog Service API

> **Base URL (qua Gateway):** `http://localhost:8888/api/catalog`
> **Base URL (truc tiep):** `http://localhost:8082/catalog`
> **Content-Type:** `application/json`

---

## Movies — `/api/catalog/movies`

### `POST /api/catalog/movies` — Tao phim moi
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
### `GET /api/catalog/movies` — Lay tat ca phim (danh sach rut gon)
### `GET /api/catalog/movies/{id}` — Lay chi tiet phim theo ID
### `GET /api/catalog/movies/slug/{slug}` — Lay phim theo slug
### `GET /api/catalog/movies/status/{status}` — Loc phim theo trang thai
> `status`: `NOW_SHOWING` | `COMING_SOON` | `ENDED` | `ARCHIVED`
### `GET /api/catalog/movies/now-showing` — Phim dang chieu
### `GET /api/catalog/movies/coming-soon` — Phim sap chieu
### `GET /api/catalog/movies/search?title={title}` — Tim phim theo ten
### `GET /api/catalog/movies/genre/{genreId}` — Lay phim theo the loai
### `PUT /api/catalog/movies/{id}` — Cap nhat thong tin phim (body giong POST)
### `PATCH /api/catalog/movies/{id}/archive` — Luu tru phim (status ARCHIVED)
### `DELETE /api/catalog/movies/{id}` — Xoa phim

---

## Genres — `/api/catalog/genres`

### `POST /api/catalog/genres` — Tao the loai phim
```json
{ "name": "Action" }
```
### `GET /api/catalog/genres` — Lay tat ca the loai
### `GET /api/catalog/genres/{id}` — Lay the loai theo ID
### `GET /api/catalog/genres/name/{name}` — Lay the loai theo ten

---

## Age Ratings — `/api/catalog/age-ratings`

### `POST /api/catalog/age-ratings` — Tao nhan phan loai tuoi
```json
{
  "code": "T13",
  "description": "Phim danh cho khan gia tu 13 tuoi tro len"
}
```
### `GET /api/catalog/age-ratings` — Lay tat ca nhan phan loai
### `GET /api/catalog/age-ratings/{id}` — Lay nhan theo ID

---

## Rooms — `/api/catalog/rooms`

### `POST /api/catalog/rooms` — Tao phong chieu
```json
{
  "name": "Phong Chieu 1",
  "totalSeats": 50,
  "screenType": "2D"
}
```
### `GET /api/catalog/rooms` — Lay tat ca phong chieu
### `GET /api/catalog/rooms/{roomId}` — Lay chi tiet phong chieu
### `PUT /api/catalog/rooms/{roomId}` — Cap nhat phong chieu
```json
{
  "name": "Phong Chieu 1 (Updated)",
  "totalSeats": 60,
  "screenType": "3D"
}
```
### `DELETE /api/catalog/rooms/{roomId}` — Xoa phong chieu

---

## Seat Types — `/api/catalog/seat-types`

### `POST /api/catalog/seat-types` — Tao loai ghe
```json
{ "name": "Standard", "description": "Ghe thuong" }
```
### `GET /api/catalog/seat-types` — Lay tat ca loai ghe
### `GET /api/catalog/seat-types/{id}` — Lay loai ghe theo ID

---

## Price Config — `/api/catalog/price-configs`

### `POST /api/catalog/price-configs` — Tao cau hinh gia cho loai ghe trong phong
```json
{
  "roomId": "<roomId>",
  "seatTypeId": "<seatTypeId>",
  "price": 75000
}
```
### `GET /api/catalog/price-configs` — Lay tat ca cau hinh gia
### `GET /api/catalog/price-configs/{id}` — Lay cau hinh gia theo ID
### `PUT /api/catalog/price-configs/{id}` — Cap nhat gia
```json
{ "price": 90000 }
```
### `DELETE /api/catalog/price-configs/{id}` — Xoa cau hinh gia

---

## Showtimes — `/api/catalog/showtimes`

### `POST /api/catalog/showtimes` — Tao suat chieu
```json
{
  "movieId": "<movieId>",
  "roomId": "<roomId>",
  "startTime": "2026-07-02T14:00:00",
  "endTime": "2026-07-02T17:00:00"
}
```
> Khong duoc overlap voi suat chieu cung phong. startTime phai trong tuong lai.

### `GET /api/catalog/showtimes` — Lay tat ca suat chieu
### `GET /api/catalog/showtimes/{showtimeId}` — Lay suat chieu theo ID
### `GET /api/catalog/showtimes/{showtimeId}/detail` — Lay chi tiet suat chieu (kem phong, phim)
### `GET /api/catalog/showtimes/movie/{movieId}` — Lay suat chieu theo phim
### `GET /api/catalog/showtimes/room/{roomId}` — Lay suat chieu theo phong
### `PUT /api/catalog/showtimes/{showtimeId}` — Cap nhat thoi gian chieu
```json
{
  "startTime": "2026-07-02T15:00:00",
  "endTime": "2026-07-02T18:00:00"
}
```
### `DELETE /api/catalog/showtimes/{showtimeId}` — Xoa suat chieu

---

## Combos — `/api/catalog/combos`

### `POST /api/catalog/combos` — Tao combo bap nuoc
```json
{
  "name": "Combo Doi",
  "description": "2 nuoc lon + 2 bap",
  "price": 120000,
  "imageUrl": "https://example.com/combo.jpg",
  "isActive": true
}
```
### `GET /api/catalog/combos` — Lay tat ca combo
### `GET /api/catalog/combos/{comboId}` — Lay combo theo ID
### `PUT /api/catalog/combos/{comboId}` — Cap nhat combo
```json
{
  "name": "Combo Doi (Updated)",
  "description": "2 nuoc lon + 2 bap + 1 snack",
  "price": 135000,
  "isActive": true
}
```
### `DELETE /api/catalog/combos/{comboId}` — Xoa combo
