package theater_mgnt.microserivce.catalog.movie.mapper;

import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateAgeRatingRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.AgeRatingResponse;
import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-29T10:48:20+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.7 (Oracle Corporation)"
)
@Component
public class AgeRatingMapperImpl implements AgeRatingMapper {

    @Override
    public AgeRatingResponse toAgeRatingResponse(AgeRating ageRating) {
        if ( ageRating == null ) {
            return null;
        }

        AgeRatingResponse.AgeRatingResponseBuilder ageRatingResponse = AgeRatingResponse.builder();

        ageRatingResponse.id( ageRating.getId() );
        ageRatingResponse.code( ageRating.getCode() );
        ageRatingResponse.description( ageRating.getDescription() );

        return ageRatingResponse.build();
    }

    @Override
    public List<AgeRatingResponse> toAgeRatingResponseList(List<AgeRating> ageRatings) {
        if ( ageRatings == null ) {
            return null;
        }

        List<AgeRatingResponse> list = new ArrayList<AgeRatingResponse>( ageRatings.size() );
        for ( AgeRating ageRating : ageRatings ) {
            list.add( toAgeRatingResponse( ageRating ) );
        }

        return list;
    }

    @Override
    public AgeRating toAgeRating(CreateAgeRatingRequest request) {
        if ( request == null ) {
            return null;
        }

        AgeRating.AgeRatingBuilder ageRating = AgeRating.builder();

        ageRating.code( request.getCode() );
        ageRating.description( request.getDescription() );

        return ageRating.build();
    }
}
