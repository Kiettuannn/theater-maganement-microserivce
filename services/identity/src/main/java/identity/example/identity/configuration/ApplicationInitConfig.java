package identity.example.identity.configuration;

import identity.example.identity.entity.Role;
import identity.example.identity.entity.User;
import identity.example.identity.enums.RoleName;
import identity.example.identity.repository.RoleRepository;
import identity.example.identity.repository.UserRepository;
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
            prefix = "spring.datasource",
            name = "driver-class-name",
            havingValue = "org.postgresql.Driver")
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

            }
        };
    }
}
