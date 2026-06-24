package theater_mgnt.microserivce.booking_service.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingListResponse {
    private List<BookingListItemResponse> bookings;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
