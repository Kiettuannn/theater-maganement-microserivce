package theater_mgnt.microserivce.identity.service;


import theater_mgnt.microserivce.identity.constant.PredefinedRole;
import theater_mgnt.microserivce.identity.dto.request.UserCreationRequest;
import theater_mgnt.microserivce.identity.dto.request.UserUpdateRequest;
import theater_mgnt.microserivce.identity.dto.response.UserResponse;
import theater_mgnt.microserivce.identity.dto.response.UsernameAvailableResponse;
import theater_mgnt.microserivce.identity.entity.Role;
import theater_mgnt.microserivce.identity.entity.User;
import theater_mgnt.microserivce.identity.exception.AppException;
import theater_mgnt.microserivce.identity.exception.ErrorCode;
import theater_mgnt.microserivce.identity.mapper.ProfileMapper;
import theater_mgnt.microserivce.identity.mapper.UserMapper;
import theater_mgnt.microserivce.identity.repository.RoleRepository;
import theater_mgnt.microserivce.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
//    ProfileClient profileClient;
    ProfileMapper profileMapper;
//    KafkaTemplate<String, Object> kafkaTemplate;

    ///  CREATE A USER
    public UserResponse createUser(UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) throw new AppException(ErrorCode.USER_EXISTED);

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById(PredefinedRole.USER_ROLE).ifPresent(roles::add);
        user.setRoles(roles);

        user = userRepository.save(user);

//        NotificationEvent notificationEvent = NotificationEvent.builder()
//                .channel("EMAIL")
//                .recipient(request.getEmail())
//                .subject("Register Successfully, Welcome to MacroxSirvest")
//                .body("Hello " + request.getUsername())
//                .build();
//
//        // Send email Kafka
//        kafkaTemplate.send("notification-delivery",notificationEvent);

        var profileRequest = profileMapper.toProfileCreationRequest(request);
        profileRequest.setUserId(user.getId());

//        profileClient.createProfile(profileRequest);

        return userMapper.toUserResponse(user);
    }

    // This API used for check realtime validation on username register
    public UsernameAvailableResponse usernameAvailable(String username) {
        if (username == null || username.isBlank()) {
            return UsernameAvailableResponse.builder()
                    .available(false)
                    .build();
        }

        boolean available = !userRepository.existsByUsername(username);
        return UsernameAvailableResponse.builder()
                .available(available)
                .build();
    }

    ///  GET ALL USERS
//    @PreAuthorize("hasAuthority('APPROVE_POST')")
//    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll();
    }

    ///  Get A USER BY ID
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        log.info("In method gets a user by Id");
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    ///  Get MY INFO
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String id = context.getAuthentication().getName();

        User user = userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }

    /// UPDATE A USER
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        userMapper.updateUser(user, request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Get roles ID (name of roles)
        var roles = roleRepository.findAllById(request.getRoles());
        user.setRoles(new HashSet<>(roles));

        return userMapper.toUserResponse(userRepository.save(user));
    }

    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }
}
