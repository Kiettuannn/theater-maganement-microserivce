package theater_mgnt.microserivce.catalog.showtime.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import theater_mgnt.microserivce.catalog.showtime.dto.request.ShowtimeCreationRequest;
import theater_mgnt.microserivce.catalog.showtime.dto.request.ShowtimeUpdateRequest;
import theater_mgnt.microserivce.catalog.showtime.dto.response.ShowtimeDetailResponse;
import theater_mgnt.microserivce.catalog.showtime.dto.response.ShowtimeResponse;
import theater_mgnt.microserivce.catalog.showtime.entity.Showtime;

@Mapper(componentModel = "spring")
public interface ShowtimeMapper {
    Showtime toShowtime(ShowtimeCreationRequest request);

    @Mapping(target = "movieId", source = "movie.id")
    @Mapping(target = "movieName", source = "movie.title")
    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomName", source = "room.name")
    ShowtimeResponse toShowtimeResponse(Showtime showtime);

    @Mapping(target = "movieId", source = "showtime.movie.id")
    @Mapping(target = "movieName", source = "showtime.movie.title")
    @Mapping(target = "roomId", source = "showtime.room.id")
    @Mapping(target = "roomName", source = "showtime.room.name")
    @Mapping(target = "totalSeats", source = "totalSeats")
    ShowtimeDetailResponse toShowtimeDetailResponse(Showtime showtime, Integer totalSeats);

    void updateShowtime(@MappingTarget Showtime showtime, ShowtimeUpdateRequest request);
}
