package theater_mgnt.microserivce.catalog.screening.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningCreationRequest;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningUpdateRequest;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningDetailResponse;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningResponse;
import theater_mgnt.microserivce.catalog.screening.entity.Screening;

@Mapper(componentModel = "spring")
public interface ScreeningMapper {
    Screening toScreening(ScreeningCreationRequest request);

    @Mapping(target = "movieId", source = "movie.id")
    @Mapping(target = "movieName", source = "movie.title")
    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomName", source = "room.name")
    ScreeningResponse toScreeningResponse(Screening screening);

    @Mapping(target = "movieId", source = "screening.movie.id")
    @Mapping(target = "movieName", source = "screening.movie.title")
    @Mapping(target = "roomId", source = "screening.room.id")
    @Mapping(target = "roomName", source = "screening.room.name")
    @Mapping(target = "totalSeats", source = "totalSeats")
    ScreeningDetailResponse toScreeningDetailResponse(
            Screening screening, Integer totalSeats);

    void updateScreening(@MappingTarget Screening screening, ScreeningUpdateRequest request);
}

