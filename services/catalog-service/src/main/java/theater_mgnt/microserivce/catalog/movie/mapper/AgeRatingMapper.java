package theater_mgnt.microserivce.catalog.movie.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import theater_mgnt.microserivce.catalog.movie.dto.request.CreateAgeRatingRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.AgeRatingResponse;
import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AgeRatingMapper {

    AgeRatingResponse toAgeRatingResponse(AgeRating ageRating);

    List<AgeRatingResponse> toAgeRatingResponseList(List<AgeRating> ageRatings);

    AgeRating toAgeRating(CreateAgeRatingRequest request);
}

