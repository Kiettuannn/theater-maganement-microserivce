package identity.example.identity.mapper;


import identity.example.identity.dto.request.RoleRequest;
import identity.example.identity.dto.response.RoleResponse;
import identity.example.identity.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    // ignore permissions to convert from Set<String> of request to Set<Permission> of RoleResponse (like Entity)
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
