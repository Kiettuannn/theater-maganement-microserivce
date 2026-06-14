package theater_mgnt.microserivce.catalog.screening.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.movie.entity.Movie;
import theater_mgnt.microserivce.catalog.room.entity.Room;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningCreationRequest;
import theater_mgnt.microserivce.catalog.screening.dto.request.ScreeningUpdateRequest;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningDetailResponse;
import theater_mgnt.microserivce.catalog.screening.dto.response.ScreeningResponse;
import theater_mgnt.microserivce.catalog.screening.entity.Screening;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-12T16:06:57+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class ScreeningMapperImpl implements ScreeningMapper {

    @Override
    public Screening toScreening(ScreeningCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        Screening.ScreeningBuilder screening = Screening.builder();

        screening.startTime( request.getStartTime() );
        screening.endTime( request.getEndTime() );

        return screening.build();
    }

    @Override
    public ScreeningResponse toScreeningResponse(Screening screening) {
        if ( screening == null ) {
            return null;
        }

        ScreeningResponse.ScreeningResponseBuilder screeningResponse = ScreeningResponse.builder();

        screeningResponse.movieId( screeningMovieId( screening ) );
        screeningResponse.movieName( screeningMovieTitle( screening ) );
        screeningResponse.roomId( screeningRoomId( screening ) );
        screeningResponse.roomName( screeningRoomName( screening ) );
        screeningResponse.id( screening.getId() );
        screeningResponse.startTime( screening.getStartTime() );
        screeningResponse.endTime( screening.getEndTime() );
        if ( screening.getStatus() != null ) {
            screeningResponse.status( screening.getStatus().name() );
        }

        return screeningResponse.build();
    }

    @Override
    public ScreeningDetailResponse toScreeningDetailResponse(Screening screening, Integer totalSeats) {
        if ( screening == null && totalSeats == null ) {
            return null;
        }

        ScreeningDetailResponse.ScreeningDetailResponseBuilder screeningDetailResponse = ScreeningDetailResponse.builder();

        if ( screening != null ) {
            screeningDetailResponse.movieId( screeningMovieId( screening ) );
            screeningDetailResponse.movieName( screeningMovieTitle( screening ) );
            screeningDetailResponse.roomId( screeningRoomId( screening ) );
            screeningDetailResponse.roomName( screeningRoomName( screening ) );
            screeningDetailResponse.id( screening.getId() );
            screeningDetailResponse.startTime( screening.getStartTime() );
            screeningDetailResponse.endTime( screening.getEndTime() );
            screeningDetailResponse.status( screening.getStatus() );
        }
        screeningDetailResponse.totalSeats( totalSeats );

        return screeningDetailResponse.build();
    }

    @Override
    public void updateScreening(Screening screening, ScreeningUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        screening.setStartTime( request.getStartTime() );
        screening.setEndTime( request.getEndTime() );
    }

    private String screeningMovieId(Screening screening) {
        if ( screening == null ) {
            return null;
        }
        Movie movie = screening.getMovie();
        if ( movie == null ) {
            return null;
        }
        String id = movie.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String screeningMovieTitle(Screening screening) {
        if ( screening == null ) {
            return null;
        }
        Movie movie = screening.getMovie();
        if ( movie == null ) {
            return null;
        }
        String title = movie.getTitle();
        if ( title == null ) {
            return null;
        }
        return title;
    }

    private String screeningRoomId(Screening screening) {
        if ( screening == null ) {
            return null;
        }
        Room room = screening.getRoom();
        if ( room == null ) {
            return null;
        }
        String id = room.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String screeningRoomName(Screening screening) {
        if ( screening == null ) {
            return null;
        }
        Room room = screening.getRoom();
        if ( room == null ) {
            return null;
        }
        String name = room.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
