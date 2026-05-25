package theater_mgnt.microserivce.identity.mapper;


import theater_mgnt.microserivce.identity.dto.request.RoleRequest;
import theater_mgnt.microserivce.identity.dto.response.RoleResponse;
import theater_mgnt.microserivce.identity.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    // ignore permissions to convert from Set<String> of request to Set<Permission> of RoleResponse (like Entity)
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
