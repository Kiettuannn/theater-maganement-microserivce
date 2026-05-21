package identity.example.identity.mapper;


import identity.example.identity.dto.request.PermissionRequest;
import identity.example.identity.dto.response.PermissionResponse;
import identity.example.identity.entity.Permission;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionsResponse(Permission permission);
}
