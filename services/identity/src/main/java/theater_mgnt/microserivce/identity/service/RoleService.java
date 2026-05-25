package theater_mgnt.microserivce.identity.service;


import theater_mgnt.microserivce.identity.dto.request.RoleRequest;
import theater_mgnt.microserivce.identity.dto.response.RoleResponse;
import theater_mgnt.microserivce.identity.mapper.RoleMapper;
import theater_mgnt.microserivce.identity.repository.PermissionRepository;
import theater_mgnt.microserivce.identity.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    // Create a role
    public RoleResponse create(RoleRequest request) {
        // Mapping the data from request, but ignore Set<String> permissions
        var role = roleMapper.toRole(request);

        // Get Set<String> permissions to convert
        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));

        // Save to database
        role = roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    // Get all roles
    public List<RoleResponse> getAll() {
        var roles = roleRepository.findAll();
        return roles.stream().map(roleMapper::toRoleResponse).toList();
    }

    // Delete a role
    public void delete(String role) {
        roleRepository.deleteById(role);
    }
}
