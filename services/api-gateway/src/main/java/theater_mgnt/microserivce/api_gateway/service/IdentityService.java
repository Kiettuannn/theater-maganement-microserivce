package theater_mgnt.microserivce.api_gateway.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import theater_mgnt.microserivce.api_gateway.dto.ApiResponse;
import theater_mgnt.microserivce.api_gateway.dto.request.IntrospectRequest;
import theater_mgnt.microserivce.api_gateway.dto.response.IntrospectResponse;
import theater_mgnt.microserivce.api_gateway.repository.IdentityClient;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class IdentityService {
    IdentityClient identityClient;
    public Mono<ApiResponse<IntrospectResponse>> introspect(String token){
        return identityClient.introspect(IntrospectRequest.builder()
                        .token(token)
                .build());
    }
}
