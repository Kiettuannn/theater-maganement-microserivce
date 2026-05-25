package theater_mgnt.microserivce.identity.mapper;


import theater_mgnt.microserivce.identity.dto.request.PermissionRequest;
import theater_mgnt.microserivce.identity.dto.response.PermissionResponse;
import theater_mgnt.microserivce.identity.entity.Permission;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionsResponse(Permission permission);
}
