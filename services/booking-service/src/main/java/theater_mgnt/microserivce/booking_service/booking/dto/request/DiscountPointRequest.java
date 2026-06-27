package com.theatermgnt.theatermgnt.booking.dto.request;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DiscountPointRequest {
    Integer pointsToRedeem;
}
