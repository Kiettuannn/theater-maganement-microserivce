package theater_mgnt.microserivce.identity.mapper;

import theater_mgnt.microserivce.identity.dto.request.ProfileCreationRequest;
import theater_mgnt.microserivce.identity.dto.request.UserCreationRequest;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    ProfileCreationRequest toProfileCreationRequest(UserCreationRequest request);
}
