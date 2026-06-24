package theater_mgnt.microserivce.catalog.configuration;

import java.time.Duration;

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
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues(); // không cache null để tránh bug ẩn
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
