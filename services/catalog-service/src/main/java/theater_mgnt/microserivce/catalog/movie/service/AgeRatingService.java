package theater_mgnt.microserivce.catalog.movie.service;

import java.util.List;

import org.springframework.stereotype.Service;

import theater_mgnt.microserivce.catalog.common.exception.AppException;
import theater_mgnt.microserivce.catalog.common.exception.ErrorCode;
import theater_mgnt.microserivce.catalog.movie.dto.request.CreateAgeRatingRequest;
import theater_mgnt.microserivce.catalog.movie.dto.response.AgeRatingResponse;
import theater_mgnt.microserivce.catalog.movie.entity.AgeRating;
import theater_mgnt.microserivce.catalog.movie.mapper.AgeRatingMapper;
import theater_mgnt.microserivce.catalog.movie.repository.AgeRatingRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AgeRatingService {

    AgeRatingRepository ageRatingRepository;
    AgeRatingMapper ageRatingMapper;

    // CREATE
    public AgeRatingResponse createAgeRating(CreateAgeRatingRequest request) {

        if (ageRatingRepository.findByCode(request.getCode()).isPresent()) {
            throw new AppException(ErrorCode.AGERATING_CODE_EXISTED);
        }

        AgeRating ageRating = ageRatingMapper.toAgeRating(request);
        AgeRating savedAgeRating = ageRatingRepository.save(ageRating);

        return ageRatingMapper.toAgeRatingResponse(savedAgeRating);
    }

    // READ
    public List<AgeRatingResponse> getAllAgeRatings() {
        List<AgeRating> ageRatings = ageRatingRepository.findAll();
        return ageRatingMapper.toAgeRatingResponseList(ageRatings);
    }

    public AgeRatingResponse getAgeRatingById(String id) {
        AgeRating ageRating =
                ageRatingRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.AGERATING_NOT_EXISTED));
        return ageRatingMapper.toAgeRatingResponse(ageRating);
    }

    public AgeRatingResponse getAgeRatingByCode(String code) {
        AgeRating ageRating = ageRatingRepository
                .findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.AGERATING_NOT_EXISTED));
        return ageRatingMapper.toAgeRatingResponse(ageRating);
    }
}

