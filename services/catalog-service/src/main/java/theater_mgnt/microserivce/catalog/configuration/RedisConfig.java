package theater_mgnt.microserivce.catalog.configuration;

import java.time.Duration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Cấu hình Redis Cache cho Catalog Service.
 *
 * Cache names và TTL:
 *  - "showtime"  : Chi tiết suất chiếu → 5 phút (hay thay đổi khi admin update)
 *  - "movie"     : Chi tiết phim theo id/slug → 10 phút (ít thay đổi hơn)
 *  - "rooms"     : Danh sách phòng → 10 phút
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * Cấu hình mặc định cho toàn bộ cache: TTL 5 phút, serialize JSON.
     * Các cache name cụ thể được override trong cacheManager() bên dưới.
     */
    @Bean
    public RedisCacheConfiguration defaultCacheConfig() {
        ObjectMapper objectMapper = new ObjectMapper();

        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Ghi @class vào JSON để deserialize đúng kiểu khi đọc từ cache
        objectMapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfBaseType(Object.class)
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL);

        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();
    }
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = defaultCacheConfig();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                // TTL riêng cho từng cache name
                .withCacheConfiguration(
                        "showtime",
                        defaultConfig.entryTtl(Duration.ofMinutes(5)))
                .withCacheConfiguration(
                        "movie",
                        defaultConfig.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration(
                        "rooms",
                        defaultConfig.entryTtl(Duration.ofMinutes(10)))
                .build();
    }
}
