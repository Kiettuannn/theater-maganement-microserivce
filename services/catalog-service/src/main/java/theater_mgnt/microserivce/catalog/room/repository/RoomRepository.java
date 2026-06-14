package theater_mgnt.microserivce.catalog.room.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import theater_mgnt.microserivce.catalog.room.entity.Room;

public interface RoomRepository extends JpaRepository<Room, String> {
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, String id);
}

