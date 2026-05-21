package identity.example.identity.mapper;

import identity.example.identity.dto.request.ProfileCreationRequest;
import identity.example.identity.dto.request.UserCreationRequest;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    ProfileCreationRequest toProfileCreationRequest(UserCreationRequest request);
}
