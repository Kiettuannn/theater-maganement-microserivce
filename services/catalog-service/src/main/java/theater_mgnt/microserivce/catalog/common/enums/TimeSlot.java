package theater_mgnt.microserivce.catalog.common.enums;

import java.time.LocalTime;

public enum TimeSlot {
    MORNING(LocalTime.of(6, 0), LocalTime.of(12, 0)),
    AFTERNOON(LocalTime.of(12, 0), LocalTime.of(18, 0)),
    EVENING(LocalTime.of(18, 0), LocalTime.of(23, 0)),
    LATE_NIGHT(LocalTime.of(23, 0), LocalTime.of(6, 0));

    private final LocalTime start;
    private final LocalTime end;

    TimeSlot(LocalTime start, LocalTime end) {
        this.start = start;
        this.end = end;
    }

    public boolean contains(LocalTime time) {
        if (start.isBefore(end)) {
            return !time.isBefore(start) && time.isBefore(end);
        }
        return !time.isBefore(start) || time.isBefore(end);
    }

    public static TimeSlot from(LocalTime time) {
        for (TimeSlot slot : values()) {
            if (slot.contains(time)) {
                return slot;
            }
        }
        throw new IllegalArgumentException("Cannot determine timeSlot " + time);
    }
}
