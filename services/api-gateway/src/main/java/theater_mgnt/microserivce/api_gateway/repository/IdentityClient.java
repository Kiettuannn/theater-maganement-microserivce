package theater_mgnt.microserivce.api_gateway.repository;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;
import theater_mgnt.microserivce.api_gateway.dto.ApiResponse;
import theater_mgnt.microserivce.api_gateway.dto.request.IntrospectRequest;
import theater_mgnt.microserivce.api_gateway.dto.response.IntrospectResponse;

public interface IdentityClient {
    @PostExchange(url = "/auth/introspect", contentType = MediaType.APPLICATION_JSON_VALUE)
    Mono<ApiResponse<IntrospectResponse>> introspect(@RequestBody IntrospectRequest introspectRequest);
}
