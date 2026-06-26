package com.theatermgnt.theatermgnt.ticket.event;

import java.util.List;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@AllArgsConstructor
@Builder
public class TicketCreatedEvent {
    UUID bookingId;
    UUID accountId;
    List<UUID> ticketIds;
}
