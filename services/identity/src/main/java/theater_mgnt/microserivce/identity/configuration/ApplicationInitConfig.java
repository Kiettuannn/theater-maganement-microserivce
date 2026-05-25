package theater_mgnt.microserivce.identity.configuration;

import theater_mgnt.microserivce.identity.entity.Role;
import theater_mgnt.microserivce.identity.entity.User;
import theater_mgnt.microserivce.identity.enums.RoleName;
import theater_mgnt.microserivce.identity.repository.RoleRepository;
import theater_mgnt.microserivce.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {
    PasswordEncoder passwordEncoder;
    UserRepository userRepository;
    RoleRepository roleRepository;


    @Bean
    @ConditionalOnProperty(
            prefix = "spring",
            value = "datasource.driver-class-name",
            havingValue = "com.mysql.cj.jdbc.Driver")
    ApplicationRunner applicationRunner(){
        return args ->  {
            if(userRepository.findByUsername("admin").isEmpty()){
                Role adminRole = roleRepository.findByName(RoleName.ADMIN.name()).orElseGet(() -> {
                    Role role = Role.builder()
                            .name(RoleName.ADMIN.name())
                            .build();
                    return  roleRepository.save(role);
                });

                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .roles(Set.of(adminRole))
                        .build();
                userRepository.save(user);
                log.warn("Admin user has been created with default password: admin, please change it");
            }
        };
    }
}
