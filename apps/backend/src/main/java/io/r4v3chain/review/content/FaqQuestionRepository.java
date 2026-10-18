package io.r4v3chain.review.content;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqQuestionRepository extends JpaRepository<FaqQuestionEntity, Long> {
	List<FaqQuestionEntity> findAllByOrderByCreatedAtDesc();
}
