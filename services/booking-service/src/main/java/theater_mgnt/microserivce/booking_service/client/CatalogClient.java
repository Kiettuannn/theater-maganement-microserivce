package theater_mgnt.microserivce.booking_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import theater_mgnt.microserivce.booking_service.client.dto.ShowtimeValidationResponse;

@FeignClient(name = "catalog-service", url = "${services.catalog.url}", path = "/catalog/internal")
public interface CatalogClient {

    @GetMapping("/screenings/{screeningId}/validate")
    ShowtimeValidationResponse validateShowtime(@PathVariable String screeningId);
}
