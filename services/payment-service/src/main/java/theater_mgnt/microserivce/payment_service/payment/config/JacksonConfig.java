package theater_mgnt.microserivce.payment_service.payment.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.data.web.SpringDataWebAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Jackson configuration for the Payment Service.
 * - Imports SpringDataWebAutoConfiguration to register PageModule,
 *   enabling Spring Data Page<T> to be serialized correctly by Jackson
 *   in REST responses (fixes "Uncategorized error" code 9999 on GET /invoices).
 * - Configures ObjectMapper with JavaTimeModule for LocalDateTime ISO serialization.
 */
@Configuration
@ImportAutoConfiguration(SpringDataWebAutoConfiguration.class)
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        return builder
                .modules(new JavaTimeModule())
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .serializationInclusion(JsonInclude.Include.NON_NULL)
                .build();
    }
}
