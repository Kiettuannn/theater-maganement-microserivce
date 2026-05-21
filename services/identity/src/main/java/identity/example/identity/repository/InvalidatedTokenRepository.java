package identity.example.identity.repository;

import identity.example.identity.entity.InvalidatedToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;

@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {
    @Modifying
    @Transactional
    @Query("DELETE FROM InvalidatedToken it WHERE it.expiryTime < :now")
    void deleteAllExpiredTokens(Date now);
}
