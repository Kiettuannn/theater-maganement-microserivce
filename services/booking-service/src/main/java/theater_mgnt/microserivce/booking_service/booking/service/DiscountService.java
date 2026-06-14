package com.theatermgnt.theatermgnt.booking.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.theatermgnt.theatermgnt.booking.entity.Booking;

@Service
public class DiscountService {
    private final int RATE = 1000;
    private final int MAX_PERCENTAGE_DISCOUNT = 50;
    private final int TOTAL_AMOUNT_RATE_TO_POINT = 20000;

    public Booking applyDiscounts(Booking booking, int pointsToRedeem) {
        BigDecimal discountAmount = BigDecimal.valueOf(pointsToRedeem).multiply(BigDecimal.valueOf(1000));
        BigDecimal maxDiscount = booking.getSubtotal()
                .multiply(BigDecimal.valueOf(MAX_PERCENTAGE_DISCOUNT))
                .divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);
        if (discountAmount.compareTo(maxDiscount) > 0) {
            throw new IllegalArgumentException("Discount exceeds maximum allowed limit.");
        }

        booking.setDiscount(discountAmount);
        booking.setTotalAmount(booking.getSubtotal().subtract(discountAmount));
        return booking;
    }

    public int calculateEarnedPoints(BigDecimal totalAmount) {
        return totalAmount
                .divide(BigDecimal.valueOf(TOTAL_AMOUNT_RATE_TO_POINT))
                .intValue();
    }

    public int caculateDiscountPoints(BigDecimal discountAmount) {
        return discountAmount.divide(BigDecimal.valueOf(RATE)).intValue();
    }
}
