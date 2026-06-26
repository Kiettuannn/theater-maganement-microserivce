package theater_mgnt.microserivce.payment_service.payment.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import theater_mgnt.microserivce.payment_service.payment.entity.PaymentMethod;

import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, String> {
    Optional<PaymentMethod> findByName(String name);
}
