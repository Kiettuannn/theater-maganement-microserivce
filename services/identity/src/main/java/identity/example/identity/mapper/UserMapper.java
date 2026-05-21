package identity.example.identity.mapper;


import identity.example.identity.dto.request.UserCreationRequest;
import identity.example.identity.dto.request.UserUpdateRequest;
import identity.example.identity.dto.response.UserResponse;
import identity.example.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    //    @Mapping(source = "" , target = "")
    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
