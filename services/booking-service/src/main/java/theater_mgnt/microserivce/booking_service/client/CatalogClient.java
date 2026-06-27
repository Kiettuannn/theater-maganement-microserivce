package theater_mgnt.microserivce.booking_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.client.dto.ComboValidationResponse;
import theater_mgnt.microserivce.booking_service.client.dto.ShowtimeValidationResponse;

@FeignClient(name = "catalog-service", url = "${services.catalog.url}", path = "/catalog/internal")
public interface CatalogClient {

    /** Validate showtime exists and is bookable */
    @GetMapping("/showtimes/{showtimeId}/validate")
    ShowtimeValidationResponse validateShowtime(@PathVariable String showtimeId);

    /** Validate combo exists and is not soft-deleted; returns snapshot data */
    @GetMapping("/combos/{comboId}")
    ComboValidationResponse getCombo(@PathVariable String comboId);
}
