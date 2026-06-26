package theater_mgnt.microserivce.catalog.common.enums;

import java.time.DayOfWeek;
import java.time.LocalDate;

public enum DayType {
    WEEKDAY,
    WEEKEND;

    public static DayType from(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) ? WEEKEND : WEEKDAY;
    }
}
