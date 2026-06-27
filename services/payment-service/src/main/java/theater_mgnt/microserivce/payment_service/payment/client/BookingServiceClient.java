package theater_mgnt.microserivce.payment_service.payment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import theater_mgnt.microserivce.payment_service.payment.client.dto.BookingSummaryResponse;
import theater_mgnt.microserivce.payment_service.common.dto.response.ApiResponse;

/**
 * Feign client to call Booking Service.
 * URL is configurable via feign.booking-service.url in application.yaml.
 */
@FeignClient(name = "booking-service", url = "${feign.booking-service.url}")
public interface BookingServiceClient {

    /**
     * GET /bookings/{bookingId}/summary
     * Returns booking detail for embedding in InvoiceDetailResponse.
     */
    @GetMapping("/bookings/{bookingId}/summary")
    ApiResponse<BookingSummaryResponse> getBookingSummary(@PathVariable("bookingId") String bookingId);
}
