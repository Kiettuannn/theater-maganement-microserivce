package theater_mgnt.microserivce.identity.mapper;


import theater_mgnt.microserivce.identity.dto.request.UserCreationRequest;
import theater_mgnt.microserivce.identity.dto.request.UserUpdateRequest;
import theater_mgnt.microserivce.identity.dto.response.UserResponse;
import theater_mgnt.microserivce.identity.entity.User;
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
