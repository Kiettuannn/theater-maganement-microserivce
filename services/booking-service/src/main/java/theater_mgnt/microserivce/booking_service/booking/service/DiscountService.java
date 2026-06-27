package theater_mgnt.microserivce.booking_service.booking.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import theater_mgnt.microserivce.booking_service.booking.entity.Booking;

/**
 * Loyalty-points discount logic (spec §8).
 *
 * Earn:   pointsEarned = totalAmount / 20000  (integer division)
 * Spend:  discountAmount = N × 1000 VND
 * Max:    discountAmount ≤ totalAmount × 50%
 */
@Service
public class DiscountService {

    private static final BigDecimal POINT_TO_VND     = BigDecimal.valueOf(1000);
    private static final BigDecimal EARN_RATE         = BigDecimal.valueOf(20000);
    private static final int        MAX_DISCOUNT_PCT  = 50;

    /**
     * Apply loyalty-point redemption to the booking.
     * Throws IllegalArgumentException if discount exceeds 50% of totalAmount.
     */
    public Booking applyDiscount(Booking booking, int pointsToRedeem) {
        BigDecimal discountAmount = BigDecimal.valueOf(pointsToRedeem).multiply(POINT_TO_VND);
        BigDecimal maxDiscount = booking.getTotalAmount()
                .multiply(BigDecimal.valueOf(MAX_DISCOUNT_PCT))
                .divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);

        if (discountAmount.compareTo(maxDiscount) > 0) {
            throw new IllegalArgumentException("Discount exceeds maximum allowed limit (50% of total).");
        }

        booking.setTotalAmount(booking.getTotalAmount().subtract(discountAmount));
        return booking;
    }

    /** pointsEarned = floor(totalAmount / 20000) */
    public int calculateEarnedPoints(BigDecimal totalAmount) {
        return totalAmount.divide(EARN_RATE, 0, RoundingMode.FLOOR).intValue();
    }

    /** pointsSpent = floor(discountAmount / 1000) */
    public int calculateSpentPoints(BigDecimal discountAmount) {
        return discountAmount.divide(POINT_TO_VND, 0, RoundingMode.FLOOR).intValue();
    }
}
