package theater_mgnt.microserivce.identity.repository;

import theater_mgnt.microserivce.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, String> {
    Optional<Role> findByName(String s);
}
