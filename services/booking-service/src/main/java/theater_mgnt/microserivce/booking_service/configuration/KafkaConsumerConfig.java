package theater_mgnt.microserivce.booking_service.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import theater_mgnt.microserivce.booking_service.event.dto.ShowtimeCancelledEvent;
import theater_mgnt.microserivce.booking_service.event.dto.ShowtimeCreatedEvent;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka consumer configuration.
 *
 * <p>Catalog Service publishes events as plain JSON (Map) WITHOUT Spring type headers,
 * so we cannot rely on {@code __TypeId__} header for deserialization.
 * Instead, we configure per-listener-type factories so each @KafkaListener gets the
 * correct target class directly from the JsonDeserializer.
 *
 * <p>We also wrap with {@link ErrorHandlingDeserializer} so that a single bad message
 * does not crash the consumer — instead it logs the error and moves to the next offset.
 */
@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    private Map<String, Object> baseConsumerProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return props;
    }

    // ─── ShowtimeCreatedEvent Consumer ────────────────────────────────────────

    @Bean
    public ConsumerFactory<String, ShowtimeCreatedEvent> showtimeCreatedConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<ShowtimeCreatedEvent> deserializer =
                new JsonDeserializer<>(ShowtimeCreatedEvent.class, objectMapper, false);
        deserializer.addTrustedPackages("*");

        Map<String, Object> props = baseConsumerProps();
        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                new ErrorHandlingDeserializer<>(deserializer));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ShowtimeCreatedEvent>
    showtimeCreatedKafkaListenerContainerFactory(ObjectMapper objectMapper) {
        ConcurrentKafkaListenerContainerFactory<String, ShowtimeCreatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(showtimeCreatedConsumerFactory(objectMapper));
        return factory;
    }

    // ─── ShowtimeCancelledEvent Consumer ──────────────────────────────────────

    @Bean
    public ConsumerFactory<String, ShowtimeCancelledEvent> showtimeCancelledConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<ShowtimeCancelledEvent> deserializer =
                new JsonDeserializer<>(ShowtimeCancelledEvent.class, objectMapper, false);
        deserializer.addTrustedPackages("*");

        Map<String, Object> props = baseConsumerProps();
        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                new ErrorHandlingDeserializer<>(deserializer));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ShowtimeCancelledEvent>
    showtimeCancelledKafkaListenerContainerFactory(ObjectMapper objectMapper) {
        ConcurrentKafkaListenerContainerFactory<String, ShowtimeCancelledEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(showtimeCancelledConsumerFactory(objectMapper));
        return factory;
    }
}
